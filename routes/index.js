var express = require('express');
var router = express.Router();
var db = require('../models/index.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/books', function (req, res, next) {
  db.books.findAll().then(function(books) {
    res.render('all_books', {books: books, title: 'All Books'});
  });
});

router.get('/books/overdue', function (req, res, next) {
  db.loans.findAll({
    where: {
      return_by: {
        lte: new Date()
      }
    },
    include: [db.books]
  }).then(function(loans) {
    res.render('filtered_books', {loans: loans, title: 'Overdue Books'});
  });
});

router.get('/books/checked-out', function (req, res, next) {
  db.loans.findAll({
    where: {
      returned_on: null
    },
    include: [db.books]
  }).then(function(loans) {
    res.render('filtered_books', {loans: loans, title: 'Checked-out Books'});
  });
});

router.get('/patrons', function (req, res, next) {
  db.patrons.findAll(req.body).then(function(patrons) {
    res.render('all_patrons', {patrons: patrons});
  });
});

router.get('/patrons/create', function(req, res, next) {
  res.render('new_patron');
});

router.post('/patrons/create', function(req, res, next) {
  db.patrons.create(req.body).then(function(){
    res.redirect('/patrons');
  }).catch(function(error) {
    if(error.name === "SequelizeValidationError") {
      res.render('new_patron', {errors: error})
    } else {
      throw error
    };
  }).catch(function(error) {
    res.status(500).send(error);
  });
});

router.get('/loans', function (req, res, next) {
  db.loans.findAll({
    include: [db.books, db.patrons]
  }).then(function(loans) {
    res.render('all_loans', {loans: loans, title: "Loans"});
  });
});

router.get('/loans/create', function (req, res, next) {
  var currentTime = new Date();
  var currentDate =  currentTime.getFullYear() + '-'
           + ('0' + (currentTime.getMonth()+1)).slice(-2) + '-'
           + ('0' + (currentTime.getDate())).slice(-2);
  var returnDate = new Date(currentTime.setTime(currentTime.getTime()+7*86400000));
  returnDate = returnDate.getFullYear() + '-'
           + ('0' + (returnDate.getMonth()+1)).slice(-2) + '-'
           + ('0' + (returnDate.getDate())).slice(-2);
  var data = { books: "", patrons: ""};
  db.books.findAll()
  .then(function(books){
    data.books = books;
    return db.patrons.findAll();
  })
  .then(function(patrons) {
    data.patrons = patrons;
    return data
  })
  .then(function (data) {
    res.render('new_loan', {data: data, date: currentDate, returnDate: returnDate});
  });
});

router.post('/loans/create', function(req, res, next) {
  db.loans.create(req.body).then(function() {
    res.redirect('/loans');
  });
});

router.get('/patrons/edit/:id', function(req, res, next) {
  db.patrons.findById(req.params.id, {
    include: [
      {
        model: db.loans,
        include: [
          {
            model: db.books
          }
        ]
      }
    ]
  }).then(function(patron) {
    res.render('patron_edit', {patron: patron});
  });
})

router.put('/patrons/edit/:id', function(req, res, next) {
  db.patrons.findById(req.params.id).then(function(patron) {
    return patron.update(req.body);
  }).then(function (patron) {
    res.redirect('/patrons');
  }).catch(function(error) {
    if(error.name === "SequelizeValidationError") {
      res.render('new_patron', {errors: error})
    } else {
      throw error
    };
  }).catch(function(error) {
    res.status(500).send(error);
  });
});

router.get('/books/edit/:id', function (req, res, next) {
  db.books.findById(req.params.id, {
    include: [
      {
        model: db.loans,
        include: [
          {
            model: db.patrons
          }
        ]
      }
    ]
  }).then(function(book){
    res.render('book_edit', {book: book, title: `Book: ${book.title}`});
  });
});

router.put('/books/edit/:id', function (req, res, next) {
  db.books.findById(req.params.id)
    .then(function(book) {
      return book.update(req.body);
    })
    .then(function() {
      res.redirect('/books');
    })
    .catch(function(error) {
    if(error.name === "SequelizeValidationError") {
      res.render('new_book', {errors: error})
    } else {
      throw error
    };
  }).catch(function(error) {
    res.status(500).send(error);
  });
});

router.get('/loans/return/:id', function (req, res, next) {
  var currentTime = new Date();
  var currentDate =  currentTime.getFullYear() + '-'
           + ('0' + (currentTime.getMonth()+1)).slice(-2) + '-'
           + ('0' + (currentTime.getDate())).slice(-2);
  db.loans.findById(req.params.id, {
    include: [db.books, db.patrons]
  })
  .then(function (loan) {
    res.render(`return_book`, {date: currentDate, loan: loan, title: "Patron: Return Book"});
  });
});

router.get('/books/create', function (req, res, next) {
  res.render('new_book');
});

router.post('/books/create', function (req, res, next) {
  db.books.create(req.body)
  .then(function() {
    res.redirect('/books');
  })
  .catch(function(error) {
    if(error.name === "SequelizeValidationError") {
      res.render('new_book', {errors: error});
    } else {
      throw error
    };
  })
  .catch(function(error) {
    res.status(500).send(error);
  });
});


module.exports = router;
