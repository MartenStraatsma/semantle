#include "fields_alloc.hpp"

#include <boost/beast/core.hpp>
#include <boost/beast/http.hpp>
#include <boost/beast/version.hpp>
#include <boost/asio.hpp>
#include <boost/url/decode_view.hpp>
#include <chrono>
#include <cstdlib>
#include <cstring>
#include <iostream>
#include <list>
#include <memory>
#include <string>

#include "koreanfasttext.h"

namespace beast = boost::beast;         // from <boost/beast.hpp>
namespace http = beast::http;           // from <boost/beast/http.hpp>
namespace net = boost::asio;            // from <boost/asio.hpp>
using tcp = boost::asio::ip::tcp;       // from <boost/asio/ip/tcp.hpp>

class http_worker {
public:
    http_worker(http_worker const&) = delete;
    http_worker& operator=(http_worker const&) = delete;

    http_worker(tcp::acceptor& acceptor, std::unique_ptr<fasttext::FastText>& fasttext) :
        acceptor_(acceptor),
        fasttext_(fasttext)
    {}

    void start() {
        accept();
        check_deadline();
    }

private:
    using alloc_t = fields_alloc<char>;
    using request_body_t = http::string_body;

    // The acceptor used to listen for incoming connections.
    tcp::acceptor& acceptor_;

    // The model that determines vector representations.
    std::unique_ptr<fasttext::FastText>& fasttext_;

    // The socket for the currently connected client.
    tcp::socket socket_{acceptor_.get_executor()};

    // The buffer for performing reads
    beast::flat_static_buffer<8192> buffer_;

    // The allocator used for the fields in the request and reply.
    alloc_t alloc_{8192};

    // The parser for reading the requests
    boost::optional<http::request_parser<request_body_t, alloc_t>> parser_;

    // The timer putting a time limit on requests.
    net::steady_timer request_deadline_{acceptor_.get_executor(), (std::chrono::steady_clock::time_point::max)()};

    // The string-based response message.
    boost::optional<http::response<http::string_body, http::basic_fields<alloc_t>>> string_response_;

    // The string-based response serializer.
    boost::optional<http::response_serializer<http::string_body, http::basic_fields<alloc_t>>> string_serializer_;

    // The vector-based response message.
    boost::optional<http::response<http::vector_body<std::byte>, http::basic_fields<alloc_t>>> vector_response_;

    // The vector-based response serializer.
    boost::optional<http::response_serializer<http::vector_body<std::byte>, http::basic_fields<alloc_t>>> vector_serializer_;

    void accept() {
        // Clean up any previous connection.
        beast::error_code ec;
        socket_.close(ec);
        buffer_.consume(buffer_.size());

        acceptor_.async_accept(
            socket_,
            [this](beast::error_code ec) {
                if (ec)
                    accept();
                else {
                    // Request must be fully processed within 60 seconds.
                    request_deadline_.expires_after(std::chrono::seconds(60));
                    read_request();
                }
            }
        );
    }

    void read_request() {
        // On each read the parser needs to be destroyed and
        // recreated. We store it in a boost::optional to
        // achieve that.
        //
        // Arguments passed to the parser constructor are
        // forwarded to the message object. A single argument
        // is forwarded to the body constructor.
        //
        // We construct the dynamic body with a 1MB limit
        // to prevent vulnerability to buffer attacks.
        //
        parser_.emplace(
            std::piecewise_construct,
            std::make_tuple(),
            std::make_tuple(alloc_)
        );

        http::async_read(socket_, buffer_, *parser_,
            [this](beast::error_code ec, std::size_t) {
                if (ec)
                    accept();
                else
                    process_request(parser_->get());
            }
        );
    }

    void process_request(http::request<request_body_t, http::basic_fields<alloc_t>> const& req) {
        switch (req.method()) {
            case http::verb::get:
                send_vector(req.target());
                break;

            default:
                // We return responses indicating an error if we do not recognize the request method.
                send_bad_response(
                    http::status::bad_request,
                    "Invalid request-method '" + std::string(req.method_string()) + "'\r\n"
                );
                break;
        }
    }

    void send_bad_response(http::status status, std::string const& error) {
        string_response_.emplace(
            std::piecewise_construct,
            std::make_tuple(),
            std::make_tuple(alloc_)
        );

        string_response_->result(status);
        string_response_->keep_alive(false);
        string_response_->set(http::field::server, BOOST_BEAST_VERSION_STRING);
        string_response_->set(http::field::content_type, "text/plain");
        string_response_->set(http::field::access_control_allow_origin, "*");
        string_response_->body() = error;
        string_response_->prepare_payload();

        string_serializer_.emplace(*string_response_);

        http::async_write(socket_, *string_serializer_,
            [this](beast::error_code ec, std::size_t) {
                socket_.shutdown(tcp::socket::shutdown_send, ec);
                string_serializer_.reset();
                string_response_.reset();
                accept();
            }
        );
    }

    void send_vector(beast::string_view encoded) {
        try {
            encoded.remove_prefix(1); // remove leading /
            boost::urls::decode_view ds( encoded );

            fasttext::Vector vec(fasttext_->getDimension());
            fasttext_->getWordVector(vec, std::string(ds.begin(), ds.end()));

            http::vector_body<std::byte>::value_type vector(
                reinterpret_cast<std::byte*>(vec.data()),
                reinterpret_cast<std::byte*>(vec.data())
                + fasttext_->getDimension() * sizeof(fasttext::real)
            );

            vector_response_.emplace(
                std::piecewise_construct,
                std::make_tuple(),
                std::make_tuple(alloc_)
            );
            
            vector_response_->result(http::status::ok);
            vector_response_->keep_alive(false);
            vector_response_->set(http::field::server, BOOST_BEAST_VERSION_STRING);
            vector_response_->set(http::field::content_type, "application/octet-stream");
            vector_response_->set(http::field::access_control_allow_origin, "*");
            vector_response_->body() = std::move(vector);
            vector_response_->prepare_payload();

            vector_serializer_.emplace(*vector_response_);

            http::async_write(socket_, *vector_serializer_,
                [this](beast::error_code ec, std::size_t) {
                    socket_.shutdown(tcp::socket::shutdown_send, ec);
                    vector_serializer_.reset();
                    vector_response_.reset();
                    accept();
                }
            );

        } catch (const std::exception& e) {
            return send_bad_response (
                http::status::internal_server_error,
                "FastText error: " + std::string(e.what()) + "\r\n"
            );
        }
    }
    
    void check_deadline() {
        // The deadline may have moved, so check it has really passed.
        if (request_deadline_.expiry() <= std::chrono::steady_clock::now()) {
            // Close socket to cancel any outstanding operation.
            socket_.close();

            // Sleep indefinitely until we're given a new deadline.
            request_deadline_.expires_at(std::chrono::steady_clock::time_point::max());
        }

        request_deadline_.async_wait([this](beast::error_code){ check_deadline(); });
    }
};

int main(int argc, char* argv[]) {
    try {
        net::io_context ioc{1};
        auto const address = net::ip::make_address("0.0.0.0");
        tcp::acceptor acceptor[3] = {
            {ioc, {address, 80}},
            {ioc, {address, 81}},
            {ioc, {address, 82}}
        };
        
        std::unique_ptr<fasttext::FastText> fasttext[3];
        fasttext[0] = std::make_unique<fasttext::FastText>();
        fasttext[0]->loadModel("/var/www/en.bin");
        fasttext[1] = std::make_unique<fasttext::KoreanFastText>();
        fasttext[1]->loadModel("/var/www/ko.bin");
        fasttext[2] = std::make_unique<fasttext::FastText>();
        fasttext[2]->loadModel("/var/www/nl.bin");

        std::list<http_worker> workers;
        for (int i = 0; i < 3; i++)
            for (int j = 0; j < 5; j++) {
                workers.emplace_back(acceptor[i], fasttext[i]);
                workers.back().start();
            }
        ioc.run();

        return EXIT_SUCCESS;

    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return EXIT_FAILURE;
    }
}