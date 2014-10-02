/*global QUnit, Backbone, fauxServer, test, strictEqual */

(function () {
    "use strict";

    // Helpers
    var doGenericSetup = function () {
            this.Book = Backbone.Model.extend({
                defaults: {
                    title: "Unknown title",
                    author: "Unknown author"
                }
            });
            this.Books = Backbone.Collection.extend({
                model: this.Book,
                url: "library-app/books"
            });
            this.createDummyBook = function (id) {
                var dummyBook = new this.Book({
                        title: "The Catcher in the Rye",
                        author: "J. D. Salinger",
                        pubDate: "July 16, 1951"
                    });
                if (id) { dummyBook.set({ id: id }); }
                return dummyBook;
            };

            Backbone.emulateHTTP = false;
            Backbone.ajax = function () { throw "Unexpected call to DOM-library ajax"; };
        },
        doGenericTeardown = function () {
            delete this.Book;
            delete this.Books;
            delete this.createDummyBook;

            fauxServer.removeRoutes();
            fauxServer.setDefaultHandler();
            fauxServer.setLatency();
        };

    //
    QUnit.module("transport (custom)", {
        setup: function () {
            doGenericSetup.call(this);
            Backbone.$ = undefined;
        },
        teardown: function () {
            doGenericTeardown.call(this);
        }
    });

    test("Sync returns previously defined custom transport", function () {
        fauxServer.addRoutes({
            createBook: { urlExp: "library-app/books",     httpMethod: "POST" },
            readBook:   { urlExp: "library-app/books/:id", httpMethod: "GET" },
            readBooks:  { urlExp: "library-app/books",     httpMethod: "GET" },
            updateBook: { urlExp: "library-app/books/:id", httpMethod: "PUT" },
            patchBook:  { urlExp: "library-app/books/:id", httpMethod: "PATCH" },
            deleteBook: { urlExp: "library-app/books/:id", httpMethod: "DELETE" }
        });

        var book = this.createDummyBook(),
            books = new this.Books(),
            transport = {};
        book.urlRoot = "library-app/books";

        fauxServer.setTransportFactory(function (/* syncOptions, syncContext */) {
            return {
                promise: function () { return transport; },
                resolve: function () {},
                reject: function () {}
            };
        });

        strictEqual(book.save(), transport, "true when saving a Model");
        book.set({ id: "0123456789" });
        strictEqual(book.fetch(), transport, "true when reading a Model");
        strictEqual(books.fetch(), transport, "true when reading a Collection");
        strictEqual(book.save(), transport, "true when updating a Model");
        strictEqual(book.save(null, { patch: true }), transport, "true when updating a Model by patching");
        strictEqual(book.destroy(), transport, "true when deleting a Model");
    });

    test("request event includes previously defined custom transport's promise", function () {
        fauxServer.addRoutes({
            createBook: { urlExp: "library-app/books",     httpMethod: "POST" },
            readBook:   { urlExp: "library-app/books/:id", httpMethod: "GET" },
            readBooks:  { urlExp: "library-app/books",     httpMethod: "GET" },
            updateBook: { urlExp: "library-app/books/:id", httpMethod: "PUT" },
            patchBook:  { urlExp: "library-app/books/:id", httpMethod: "PATCH" },
            deleteBook: { urlExp: "library-app/books/:id", httpMethod: "DELETE" }
        });

        var book = this.createDummyBook(),
            books = new this.Books(),
            transport = {};
        book.urlRoot = "library-app/books";

        fauxServer.setTransportFactory(function (/* syncOptions, syncContext */) {
            return {
                promise: function () { return transport; },
                resolve: function () {},
                reject: function () {}
            };
        });

        //
        book.on("request", function (__, xhr) {
            strictEqual(xhr, transport, "true when saving a model");
        });
        book.save();
        book.off("request");

        //
        book.set({ id: "0123456789" });
        book.on("request", function (__, xhr) {
            strictEqual(xhr, transport, "true when reading a model");
        });
        book.fetch();
        book.off("request");

        //
        books.on("request", function (__, xhr) {
            strictEqual(xhr, transport, "true when reading a Collection");
        });
        books.fetch();
        books.off("request");

        //
        book.on("request", function (__, xhr) {
            strictEqual(xhr, transport, "true when updating a Model");
        });
        book.save();
        book.off("request");

        //
        book.on("request", function (__, xhr) {
            strictEqual(xhr, transport, "true when updating a Model by patching");
        });
        book.save(null, { patch: true });
        book.off("request");

        //
        book.on("request", function (__, xhr) {
            strictEqual(xhr, transport, "true when deleting a Model");
        });
        book.destroy();
        book.off("request");
    });

    test("Returned transport is 'fulfilled' on sync success", 6, function () {
        var book = this.createDummyBook(),
            books = new this.Books(),
            setTransportFactoryAndExpect = function (expectedResult, msg) {
                fauxServer.setTransportFactory(function (/* options */) {
                    return {
                        promise: function () {},
                        reject: function () {},
                        resolve: function (result) {
                            strictEqual(result, expectedResult, msg);
                        }
                    };
                });
            };
        book.urlRoot = "library-app/books";

        fauxServer.addRoute("library-app/books", "POST", function () { return 303; });
        setTransportFactoryAndExpect(303, "true when saving a Model");
        book.save();

        fauxServer.addRoute("library-app/books/:id", "GET", function () { return 304; });
        setTransportFactoryAndExpect(304, "true when reading a Model");
        book.set({ id: "0123456789" });
        book.fetch();

        fauxServer.addRoute("library-app/books", "GET", function () { return 305; });
        setTransportFactoryAndExpect(305, "true when reading a Collection");
        books.fetch();

        fauxServer.addRoute("library-app/books/:id", "PUT", function () { return 306; });
        setTransportFactoryAndExpect(306, "true when updating a Model");
        book.save();

        fauxServer.addRoute("library-app/books/:id", "PATCH", function () { return 307; });
        setTransportFactoryAndExpect(307, "true when updating a Model by patching");
        book.save(null, { patch: true });

        fauxServer.addRoute("library-app/books/:id", "DELETE", function () { return 308; });
        setTransportFactoryAndExpect(308, "true when deleting a Model");
        book.destroy();
    });

    test("Returned transport is 'rejected' on sync error", 6, function () {
        var book = this.createDummyBook(),
            books = new this.Books(),
            setTransportFactoryAndExpect = function (expectedReason, msg) {
                fauxServer.setTransportFactory(function (/* options */) {
                    return {
                        promise: function () {},
                        resolve: function () {},
                        reject: function (reason) {
                            strictEqual(reason, expectedReason, msg);
                        }
                    };
                });
            };
        book.urlRoot = "library-app/books";

        fauxServer.addRoute("library-app/books", "POST", function () { return "303"; });
        setTransportFactoryAndExpect("303", "true when saving a Model");
        book.save();

        fauxServer.addRoute("library-app/books/:id", "GET", function () { return "304"; });
        setTransportFactoryAndExpect("304", "true when reading a Model");
        book.set({ id: "0123456789" });
        book.fetch();

        fauxServer.addRoute("library-app/books", "GET", function () { return "305"; });
        setTransportFactoryAndExpect("305", "true when reading a Collection");
        books.fetch();

        fauxServer.addRoute("library-app/books/:id", "PUT", function () { return "306"; });
        setTransportFactoryAndExpect("306", "true when updating a Model");
        book.save();

        fauxServer.addRoute("library-app/books/:id", "PATCH", function () { return "307"; });
        setTransportFactoryAndExpect("307", "true when updating a Model by patching");
        book.save(null, { patch: true });

        fauxServer.addRoute("library-app/books/:id", "DELETE", function () { return "308"; });
        setTransportFactoryAndExpect("308", "true when deleting a Model");
        book.destroy();
    });
}());
