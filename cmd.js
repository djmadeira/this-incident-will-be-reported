/**
  * Way to view source bro/sis! Here's a rundown of how it works:
  * derp derp hax quick solution half-assed thing derp herp derp.
  * Don't look, unless you were looking for a manual on how *not* to write code.
**/

var webcomponentsPolyfill = require('polyfill-webcomponents');

// ------------- Boring Polyfills --------------- //
window.requestAnimationFrame = window.requestAnimationFrame ||
  window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||
  function (func) {
    window.setTimeout(func, 33); // 30 FPS
  };

var app = function () {
  var inputTemplate, // Template for the input
      lnTemplate, // Template for a new line
      term, // The terminal in the DOM. This shouldn't go anywhere, so this won't have to be updated.
      input,
      debug,
      installed,
      notes,
      errorMsgs;

  var init = function () {
    inputTemplate = getTemplate('input-template');
    lnTemplate = getTemplate('ln-template');
    term = gtById('terminal');
    input;
    debug = true;
    installed = {};
    notes = [];
    errorMsgs = {};

    gtById('save').addEventListener('click', saveGame);
    gtById('load').addEventListener('click', loadGame);

    appendInput();
    focusInput();
  };

  // --------------- Util Functions --------------- //

  // getElementById wrapper
  var gtById = function (id) {
    return document.getElementById(id);
  };

  // console.log wrapper
  var log = function (msg) {
    if ( debug ) { console.log(msg); }
  };

  // Gets a template (with a "polyfill" lol not)
  var getTemplate = function (id) {
    var template = gtById(id);
    if ( ! template ) { return false; }
    if ( template.content ) {
      return template.content.cloneNode(true);
    } else {
      return template.firstChild.cloneNode(true);
    }
  };

  // Generate a unique, hexy ID (move that hexy bod grrl)
  var uniqueId = function uniqueId () {
    var id = '';
        length = 16, // hnnnng so hexy
        chars = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f']; // That's 18,446,744,073,709,600,000 possibilities for those of you following at home
    for (var i=0; i < length; i++) {
      id += chars[Math.floor(Math.random() * 16)];
    }
    if ( gtById(id) ) {
      return uniqueId(); // recursive hnnnng
    } else {
      return id;
    }
  };

  // -------------- Base Functions ---------------- //

  // When called, gets input from the field (if any) and calls the appropriate program, passing it token-ized arguments.
  var parseInput = function () {;
    var val = input.value;
    if (val) {
      var tokens = val.split(' ');
      if ( state.installed[tokens[0]] ) {
        state.installed[tokens[0]].run(tokens);
      } else {
        var lnout = appendOutput();
        lnout.innerHTML = err.cmdNotFound;
        focusInput();
      }
    }
  };

  // Appends a new output div with a unique ID. Returns a reference to the DOM node for further manipulation.
  var appendOutput = function () {
    var ln = lnTemplate.querySelector('.shell-ln').cloneNode(true),
        id = uniqueId();
    gtById('shell').parentNode.removeChild(gtById('shell'));
    ln.id = id;
    term.appendChild(ln);
    return ln;
  }

  // Usually called from the callback for programs; gives the user input ability after programs are finished running.
  var appendInput = function () {
    if ( !gtById('input') ) {
      inputTemplate = getTemplate('input-template');
      term.appendChild(inputTemplate);
      input = gtById('input');
      input.addEventListener('keydown', function (e) {
        if (e.keyIdentifier == "Enter") {
          parseInput();
        }
      });
    }
  };

  var focusInput = function () {
    if ( !gtById('input') ) {
      appendInput();
    }
    input.focus();
  }

  // Replace the keywords in a string, similar to PHP's `sprintf`.
  var keywordReplace = function (string, values) {
    var values = values || {}, i=1;
    for (var val in values) {
      string = string.replace('%'+i, val);
    }
    return string;
  };

  var fitInStr = function (str, length) {
    if ( str.length > length ) {
      // Put a .. on the end to show it trailing off if it's too long
      return str.substring(0, str.length - 2) + '..';
    } else {
      // Lengthen the string with ' ' until it meets the number of characters required
      var whitespace = " ";
      while ( whitespace.length < length - str.length ) { whitespace += " " };
      return str + whitespace;
    }
  };

  var spc = function () {
    return '\n<span class="spc"></span>';
  }

  // Sound "engine". Collection of functions for loading, playing and pausing sounds. Can also interrupt sounds.
  var loadSound = function (id, url, cb) {
    if ( gtById(id) ) { cb(id); return; }

    cb(id);
  };

  var getData = function (query, cb) {
    var request = new XMLHttpRequest ();
    request.onload = cb;
    request.open('get', window.location.href + 'get.php?' + query, true);
    request.send();
  };

  var saveGame = function () {
    alert( JSON.stringify( gameState ) );
  };

  var loadGame = function () {
    alert('What you wanna load?');
  };

  var Note = function (my) {
    var my = my || {};
    var that = {};

    if ( my.removable == true ) {
      var template = getTemplate('note-rm-template');
    } else {
      var template = getTemplate('note-template');
    }

    var id = uniqueId();

    that.dragClickX = 0;
    that.dragClickY = 0;
    that.dragOffsetX = 0;
    that.dragOffsetY = 0;

    that.display = function () {
      var note = template.querySelector('.note');

      var noteText = document.createElement('p');

      noteText.innerHTML = my.text;
      note.appendChild(noteText);
      note.id = id;
      term.appendChild(note);

      note.addEventListener('mousedown', function (event) {
        window[my.name].dragClickX = event.x;
        window[my.name].dragClickY = event.y;
        window.addEventListener('mousemove', window[my.name].drag);
      });
      note.addEventListener('mouseup', function () {
        window[my.name].dragClickX = undefined;
        window[my.name].dragClickY = undefined;
        window[my.name].dragOffsetX = parseInt(this.style.transform.match(/translateX\((-?[0-9]{1,})px\)/)[1]);
        window[my.name].dragOffsetY = parseInt(this.style.transform.match(/translateY\((-?[0-9]{1,})px\)/)[1]);
        window.removeEventListener('mousemove', window[my.name].drag);
        input.focus();
      });
      if (my.removable) {
        note.querySelector('.note-rm').addEventListener('click', function () {
          this.parentNode.parentNode.removeChild(this.parentNode);
        });
      }
    };

    that.drag = function (e) {
      var transValue = "translateX(" + (e.x - window[my.name].dragClickX + window[my.name].dragOffsetX) + "px) translateY(" + (e.y - window[my.name].dragClickY + window[my.name].dragOffsetY) + "px)",
          el = gtById(id);
      el.style.transform = transValue;
      el.style.webkitTransform = transValue;
    };

    return that;
  };

  var Program = function (my) {
    var my = my || {},
        that = {};

    that.use = my.use;
    that.desc = my.desc;

    that.run = function (input) {
      var lnout = appendOutput();
      input.splice(0, 1);

      if ( typeof my.process == 'function' ) {
        my.process(input, lnout, function () {
          focusInput();
        });
      } else {
        lnout.innerHTML = err.noOutput;
      }
    }

    return that;
  };

  init();

  var state = {
    installed: {},
    user: 'rachel',
    wd: {
      'read.pg': 'net://read',
      'crash.log': "31.11.16 22:51: CRITICAL FAILURE: CONNECTION TERMINATED BY SYSTEM. Details:\n"
    }
  };

  var err = {
    noOutput: "This program has no output function (that's a bug)",
    cmdNotFound: "Err: program does not exist (try \"help\")"
  }

  window.setTimeout(function () {
    startNote = Note({ // declared globally on purpose
      name: 'startNote',
      text: 'smashthestate',
      removable: true
    });
    startNote.display();
  }, 5000);


  state.installed.help = Program({
    desc: "Displays info about installed programs.",
    use: "Usage:\n"+ fitInStr("help", 19) + " | List all installed programs.\n" + fitInStr("help [program]", 19) +" | Display information about a program.",
    process: function (input, lnout, cb) {
      if ( input[0] != undefined ) {
        if ( state.installed[input[0]] ) {
          lnout.innerHTML = 'Description:\n'+ state.installed[input[0]].desc + spc() + state.installed[input[0]].use;
        } else {
          lnout.innerHTML = 'Program "'+ input[0] +'" not found.';
        }
      } else {
        var print = "Installed programs:\n";
        for (var program in state.installed) {
          print += '  '+ program +'\n';
        }

        lnout.innerHTML = print;
      }
      cb();
    }
  });

  state.installed.whoami = Program({
    desc: 'Displays info about the current user',
    use: 'Usage:\nwhoami',
    process: function (input, lnout, cb) {
      lnout.innerHTML = state.user;
      cb();
    }
  });

  state.installed.install = Program({
    desc: 'Install programs from a .pg file or netloc.',
    use: 'Usage:\ninstall loc (where "loc" is the net:// location of the program or the name of a .pg file in the working directory)',
    process: function (input, lnout, cb) {
      log(input);
      if (!input[0]) {
        lnout.innerHTML = this.use;
        return cb();
      }
      if (state.wd[input[0]] && secret[input[0]]) {
        var name = secret[input[0]].name;
        state.installed[name] = Program(secret[input[0]].program);
        delete state.wd[input[0]];
        var anim = getTemplate('install-animation-template');
        lnout.appendChild(anim);
        var el = document.createElement('span');
        el.innerHTML = 'Program "' + name + '" installed successfully.';
        window.setTimeout(function (cb, lnout, el) {
          lnout.appendChild(el);
          cb();
        }, 2000, cb, lnout, el);
      } else {
        lnout.innerHTML = 'Program "' + name + '" not found.';
        cb();
      }
    },
  })

  state.installed.list = Program({
    desc: 'List files in the current working directory',
    use: 'Usage: \nlist',
    process: function (input, lnout, cb) {
      var output = "";
      for (var $file in state.wd) {
        output += $file + '\n';
      }
      lnout.innerHTML = output;
      cb();
    }
  });

  var secret = {
    'read.pg': {
      name: 'read',
      program: {
        desc: 'Read files in the working directory',
        use: 'Usage:\nread file (where "file" is the name of a file in the working directory)',
        process: function (input, lnout, cb) {
          if ( ! input[0] ) {
            lnout.innerHTML = this.use;
          } else {
            if ( state.wd[input[0]] ) {
              var fileHeader = document.createElement('span');
              fileHeader.innerHTML = 'File contents:\n==============\n';
              lnout.appendChild(fileHeader);
              var fileRead = document.createElement('span');
              fileRead.innerHTML = state.wd[input[0]];
              lnout.appendChild(fileRead);
              var fileFooter = document.createElement('span');
              fileFooter.innerHTML = '==============';
              lnout.appendChild(fileFooter);
            } else {
              lnout.innerHTML = "File not found or not a readable file: " + input[0];
            }
          }
          cb();
        }
      }
    }
  };

};

window.requestAnimationFrame(app);
