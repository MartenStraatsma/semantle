#include "fields_alloc.hpp"
#include "server_certificate.hpp"

#include <boost/beast/core.hpp>
#include <boost/beast/http.hpp>
#include <boost/beast/version.hpp>
#include <boost/asio/ssl.hpp>
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
namespace ssl = boost::asio::ssl;       // from <boost/asio/ssl.hpp>
using tcp = boost::asio::ip::tcp;       // from <boost/asio/ip/tcp.hpp>

class http_worker : public std::enable_shared_from_this<http_worker> {
  public:
    http_worker(http_worker const&) = delete;
    http_worker& operator=(http_worker const&) = delete;

    http_worker(tcp::acceptor& acceptor, ssl::context& ctx, std::unique_ptr<fasttext::FastText>& fasttext) :
        acceptor_(acceptor),
        ctx_(ctx),
        fasttext_(fasttext)
    {
    }

    void start()
    {
        do_accept();
    }

  private:
    using alloc_t = fields_alloc<char>;
    using request_body_t = http::string_body;

    // The acceptor used to listen for incoming connections.
    tcp::acceptor& acceptor_;

    // The SSL context for managing the SSL connection.
    ssl::context& ctx_;

    // The model that determines vector representations.
    std::unique_ptr<fasttext::FastText>& fasttext_;

    // The stream for the SSL connection.
    std::unique_ptr<ssl::stream<beast::tcp_stream>> stream_ = std::make_unique<ssl::stream<beast::tcp_stream>>(acceptor_.get_executor(), ctx_);

    // The buffer for performing reads
    beast::flat_static_buffer<8192> buffer_;

    // The allocator used for the fields in the request and reply.
    alloc_t alloc_{8192};

    // The parser for reading the requests
    boost::optional<http::request_parser<request_body_t, alloc_t>> parser_;

    // The empty response message.
    boost::optional<http::response<http::empty_body, http::basic_fields<alloc_t>>> empty_response_;

    // The empty response serializer.
    boost::optional<http::response_serializer<http::empty_body, http::basic_fields<alloc_t>>> empty_serializer_;

    // The string-based response message.
    boost::optional<http::response<http::string_body, http::basic_fields<alloc_t>>> string_response_;

    // The string-based response serializer.
    boost::optional<http::response_serializer<http::string_body, http::basic_fields<alloc_t>>> string_serializer_;

    // The vector-based response message.
    boost::optional<http::response<http::vector_body<std::byte>, http::basic_fields<alloc_t>>> vector_response_;

    // The vector-based response serializer.
    boost::optional<http::response_serializer<http::vector_body<std::byte>, http::basic_fields<alloc_t>>> vector_serializer_;

    // Report a failure
    void fail (beast::error_code ec, char const* what) {
        // ssl::error::stream_truncated, also known as an SSL "short read",
        // indicates the peer closed the connection without performing the
        // required closing handshake (for example, Google does this to
        // improve performance). Generally this can be a security issue,
        // but if your communication protocol is self-terminated (as
        // it is with both HTTP and WebSocket) then you may simply
        // ignore the lack of close_notify.
        //
        // https://github.com/boostorg/beast/issues/38
        //
        // https://security.stackexchange.com/questions/91435/how-to-handle-a-malicious-ssl-tls-shutdown
        //
        // When a short read would cut off the end of an HTTP message,
        // Beast returns the error beast::http::error::partial_message.
        // Therefore, if we see a short read here, it has occurred
        // after the message has been completed, so it is safe to ignore it.

        if (ec != net::ssl::error::stream_truncated)
            std::cerr << what << ": " << ec.message() << "\n";

        return do_accept();
    }

    void do_accept () {
        // Clean up any previous connection.
        beast::error_code ec;
        stream_->lowest_layer().close(ec);
        stream_ = std::make_unique<ssl::stream<beast::tcp_stream>>(std::move(beast::get_lowest_layer(*stream_)), ctx_);
        buffer_.consume(buffer_.size());
        
        acceptor_.async_accept(
            stream_->lowest_layer(),
            beast::bind_front_handler(
                &http_worker::on_accept,
                shared_from_this()
            )
        );
    }

    void on_accept (beast::error_code ec) {
        return ec ? fail (ec, "accept") : do_handshake();
    }

    void do_handshake () {
        // Set the timeout
        beast::get_lowest_layer(*stream_).expires_after(std::chrono::seconds(30));

        // Perform the SSL handshake
        stream_->async_handshake(
            ssl::stream_base::server,
            beast::bind_front_handler(
                &http_worker::on_handshake,
                shared_from_this()
            )
        );
    }

    void on_handshake (beast::error_code ec) {
        return ec ? fail (ec, "handshake") : do_read();
    }

    void do_read () {
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

        parser_.emplace(
            std::piecewise_construct,
            std::make_tuple(),
            std::make_tuple(alloc_)
        );

        
        // Set the timeout
        beast::get_lowest_layer(*stream_).expires_after(std::chrono::seconds(30));

        // Read the request
        http::async_read(*stream_, buffer_, *parser_,
            beast::bind_front_handler(
                &http_worker::on_read,
                shared_from_this()));
    }

    void on_read (beast::error_code ec, std::size_t) {
        // This means they closed the connection
        if (ec == http::error::end_of_stream)
            return do_close();
        if (ec)
            return fail(ec, "read");

        switch (parser_->get().method()) {
            case http::verb::head:
                send_head();
                break;

            case http::verb::get:
                send_vector();
                break;

            default:
                // We return responses indicating an error if
                // we do not recognize the request method.
                send_bad_response(
                    http::status::bad_request,
                    "Invalid request-method '" + std::string(parser_->get().method_string()) + "'\r\n"
                );
                break;
        }
    }

    void send_head () {
        empty_response_.emplace(
            std::piecewise_construct,
            std::make_tuple(),
            std::make_tuple(alloc_)
        );

        empty_response_->result(http::status::ok);
        empty_response_->keep_alive(parser_->get().keep_alive());
        empty_response_->set(http::field::server, BOOST_BEAST_VERSION_STRING);
        empty_response_->set(http::field::content_type, "application/octet-stream");
        empty_response_->set(http::field::access_control_allow_origin, "*");
        empty_response_->prepare_payload();

        empty_serializer_.emplace(*empty_response_);

        http::async_write(*stream_, *empty_serializer_,
            beast::bind_front_handler (
                &http_worker::on_write_head,
                shared_from_this()));
    }

    void on_write_head (beast::error_code ec, std::size_t) {
        empty_serializer_.reset();
        empty_response_.reset();
        return ec ? fail (ec, "write head") : parser_->get().keep_alive() ? do_read() : do_close();
    }

    void send_vector () {
        try {
            parser_->get().target().remove_prefix(1); // remove leading /
            boost::urls::decode_view ds( parser_->get().target() );

            fasttext::Vector vec(fasttext_->getDimension());
            fasttext_->getWordVector(vec, std::string(ds.begin(), ds.end()));

            http::vector_body<std::byte>::value_type vector(
                reinterpret_cast<std::byte*>(vec.data()),
                reinterpret_cast<std::byte*>(vec.data()) + fasttext_->getDimension() * sizeof(fasttext::real)
            );

            vector_response_.emplace(
                std::piecewise_construct,
                std::make_tuple(),
                std::make_tuple(alloc_)
            );

            vector_response_->result(http::status::ok);
            vector_response_->keep_alive(parser_->get().keep_alive());
            vector_response_->set(http::field::server, BOOST_BEAST_VERSION_STRING);
            vector_response_->set(http::field::content_type, "application/octet-stream");
            vector_response_->set(http::field::access_control_allow_origin, "*");
            vector_response_->body() = std::move(vector);
            vector_response_->prepare_payload();

            vector_serializer_.emplace(*vector_response_);

            http::async_write(*stream_, *vector_serializer_,
                beast::bind_front_handler (
                    &http_worker::on_write_vector,
                    shared_from_this()));

        } catch (const std::exception& e) {
            return send_bad_response (
                http::status::internal_server_error,
                "FastText error: " + std::string(e.what()) + "\r\n"
            );
        }
    }

    void on_write_vector (beast::error_code ec, std::size_t) {
        vector_serializer_.reset();
        vector_response_.reset();
        return ec ? fail (ec, "write vector") : parser_->get().keep_alive() ? do_read() : do_close();
    }

    void send_bad_response (http::status status, std::string const& error) {
        string_response_.emplace(
            std::piecewise_construct,
            std::make_tuple(),
            std::make_tuple(alloc_)
        );

        string_response_->result(status);
        string_response_->keep_alive(parser_->get().keep_alive());
        string_response_->set(http::field::server, BOOST_BEAST_VERSION_STRING);
        string_response_->set(http::field::content_type, "text/plain");
        string_response_->set(http::field::access_control_allow_origin, "*");
        string_response_->body() = error;
        string_response_->prepare_payload();

        string_serializer_.emplace(*string_response_);

        http::async_write(*stream_, *string_serializer_,
            beast::bind_front_handler (
                &http_worker::on_write_bad_response,
                shared_from_this()));
    }

    void on_write_bad_response (beast::error_code ec, std::size_t) {
        string_serializer_.reset();
        string_response_.reset();
        return ec ? fail (ec, "write bad response") : parser_->get().keep_alive() ? do_read() : do_close();
    }

    void do_close () {
        // Set the timeout
        beast::get_lowest_layer(*stream_).expires_after(std::chrono::seconds(30));

        // Perform the SSL shutdown
        stream_->async_shutdown(
            beast::bind_front_handler(
                &http_worker::on_shutdown,
                shared_from_this()
            )
        );
    }

    void on_shutdown (beast::error_code ec) {
        if (ec)
            return fail (ec, "stream shutdown");

        stream_->lowest_layer().shutdown(tcp::socket::shutdown_send, ec);
        return ec ? fail (ec, "socket shutdown") : do_accept();
    }
};

int main(int argc, char* argv[]) {
    try {
        net::io_context ioc{1};
        ssl::context ctx{ssl::context::tlsv12};
        load_server_certificate(ctx);
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

        std::list<std::shared_ptr<http_worker>> workers;
        for (int i = 0; i < 3; i++)
            for (int j = 0; j < 128; j++) {
                workers.emplace_back(std::make_shared<http_worker>(acceptor[i], ctx, fasttext[i]));
                workers.back()->start();
            }
        ioc.run();

        return EXIT_SUCCESS;

    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return EXIT_FAILURE;
    }
}