var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var template = require('./lib/template.js');
var path = require('path');
var sanitizeHtml = require('sanitize-html');
var mysql = require('mysql');
var db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '111111',
  database: 'opentutorials'
})

var app = http.createServer(function (request, response) {
  var _url = request.url;
  var queryData = url.parse(_url, true).query;
  //console.log(url, url.parse(_url, true), url.parse(_url, true).query)
  console.log('\n\n\n\n\n\n\n\n');
  var pathname = url.parse(_url, true).pathname;
  if (pathname === '/') {
    if (queryData.id === undefined) {
      db.query(`SELECT * FROM topic`, (err, topics) => {
        //console.log(topics);
        var title = 'Welcome!';
        var description = 'Hello, Node.js';
        var list = template.list(topics);
        var html = template.HTML(title, list,
          `<h2>${title}</h2>${description}`,
          `<a href="/create">create</a>`);
        response.writeHead(200);
        response.end(html);
      });
    } else {
      db.query(`SELECT * FROM topic`, (err, topics) => {
        if (err) { console.log(err) };
        db.query(`SELECT * FROM topic WHERE id=?`, [queryData.id], (err, topic) => {
          if (err) { console.log(err) };
          //console.log(topic);
          var title = topic[0].title;
          var description = topic[0].description;
          var list = template.list(topics);
          var html = template.HTML(title, list,
            `<h2>${title}</h2>${description}`,
            `<a href="/create">create</a>
              <a href="/update?id=${queryData.id}">update</a>
              <form action="delete_process" method="post">
                <input type="hidden" name="id" value="${queryData.id}">
                <input type="submit" value="delete">
              </form>`);
          response.writeHead(200);
          response.end(html);
        })
      });
    }
  } else if (pathname === '/create') {
    db.query('SELECT * FROM topic', (err, topics) => {
      if (err) { console.log(err) };
      var title = 'Create';
      var list = template.list(topics);
      var html = template.HTML(title, list, `
      <h2>${title}</h2>
      <form action="/create_process" method="post">
      <p><input type="text" name="title" placeholder="title"></p>
      <p>
      <textarea name="description" placeholder="description"></textarea>
      </p>
      <p>
      <input type="submit">
      </p>
      </form>
      `, '');
      response.writeHead(200);
      response.end(html);
    });
  } else if (pathname === '/create_process') {
    var body = '';
    request.on('data', function (data) {
      body = body + data;
    });
    request.on('end', function () {
      var post = qs.parse(body);
      console.log(post, post.title, post.description);
      var title = post.title;
      var description = post.description;
      db.query(`
        INSERT INTO topic (title, description, created, author_id)
        VALUES(?, ?, NOW(), ?)`,
        [post.title, post.description, 1], (err, result) => {
          if (err) { throw err };
          response.writeHead(302, { location: `/?id=${result.insertId}` });
          response.end();
        })
    });
  } else if (pathname === '/update') {
    // fs.readdir('./data', function (error, filelist) {
    //   var filteredId = path.parse(queryData.id).base;
    //   fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
    //     var title = queryData.id;
    //     var list = template.list(filelist);
    // //     var html = template.HTML(title, list,
    //       `
    //         <form action="/update_process" method="post">
    //           <input type="hidden" name="id" value="${title}">
    //           <p><input type="text" name="title" placeholder="title" value="${title}"></p>
    //           <p>
    //             <textarea name="description" placeholder="description">${description}</textarea>
    //           </p>
    //           <p>
    //             <input type="submit">
    //           </p>
    //         </form>
    //         `,
    //       `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
    //     );
    //     response.writeHead(200);
    //     response.end(html);
    //   });
    // });
    db.query('SELECT * FROM topic', (err, topics) => {
      if(err) throw err;
      db.query('SELECT * FROM topic WHERE id=?',[queryData.id], (err, topic) => {
        if (err) { console.log(err) };
        console.log(topic, queryData.id)
        var title = `Update ${topic[0].title}`;
        console.log(title);
        var list = template.list(topics);
        var html = template.HTML(title, list, `
        <h2>${title}</h2>
        <form action="/update_process" method="post">
        <p><input type="text" name="title" placeholder="title" value="${topic[0].title}"></p>
        <p>
        <textarea name="description" placeholder="description">${topic[0].description}</textarea>
        </p>
        <p>
        <input type="submit">
        <input type="hidden" value="${queryData.id}" name="id" />
        </p>
        </form>
        `, '');
        response.writeHead(200);
        response.end(html);
      })
    })
  } else if (pathname === '/update_process') {
    var body = '';
    request.on('data', function (data) {
      body = body + data;
    });
    request.on('end', function () {
      var post = qs.parse(body);
      var id = post.id;
      var title = post.title;
      var description = post.description;
      console.log('post', post);
      // fs.rename(`data/${id}`, `data/${title}`, function (error) {
      //   fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
      //     response.writeHead(302, { Location: `/?id=${title}` });
      //     response.end();
      //   })
      // });
      db.query(`
        UPDATE topic
        SET title = '${title}', description = '${description}'
        WHERE id = ${id};`,(err, res) => {
          if(err) throw err;
          console.log(res);
          response.writeHead(302, {Location: `/?id=${title}`});
        }
        )
        response.writeHead(302, {Location:`/?id=${id}`});
        response.end();
    });
  } else if (pathname === '/delete_process') {
    var body = '';
    request.on('data', function (data) {
      body = body + data;
    });
    request.on('end', function () {
      var post = qs.parse(body);
      var id = post.id;
      var filteredId = path.parse(id).base;
      // fs.unlink(`data/${filteredId}`, function (error) {
      //   response.writeHead(302, { Location: `/` });
      //   response.end();
      // })
      db.query(`DELETE FROM topic WHERE id=${id};`, (err, res) =>{
        if(err) throw err;
        console.log(res);
      })
      response.writeHead(302, { Location: `/` });
      response.end();
    });
  } else {
    response.writeHead(404);
    response.end('Not found');
  }
});
app.listen(3000);
