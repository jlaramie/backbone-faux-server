Backbone Faux Server Books-AMD example
======================================

An example app that displays books attributes, fetched over an imaginary, mocked API. BFS (as
well as other dependencies, JQuery, Underscore and Backbone) are treated as AMD modules - see
`main.js`. (The 'books' example offers a use case where BFS is included through a `<script>` tag.)
Application code lives in `app.js` whereas BFS routes are defined in `server.js`.


Running
-------

In the example folder, `bower install` to get all dependencies. You can serve the application using
your own web server or use Grunt's connect plugin: `npm install` to get dev-dependencies and then
`grunt connect:server:keepalive` to run a local connect server listening on `localhost:3333`.
