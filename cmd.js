/**
  * Way to view source bro/sis! Here's a rundown of how it works:
  * derp derp hax quick solution half-assed thing derp herp derp.
  * Don't look, unless you were looking for a manual on how *not* to write code.
**/

/*
App
  -dom  template // the template for the terminal
  -dom  lntemplate // the template for a new line
  -bool debug // whether debugging or not
  -obj  installed // installed programs (accessable by player)
  -obj  notes // Currently displayed notes
  -obj  err // key: values for errors of a certain type. Regex for %1 etc to replace if needed
  -func gtById (str id) : dom id || null // alias for document.getelementbyid
  -func log (msg) : null // alias for console.log (if debug flag enabled)
  -func parseInput (str input) : // sanitize input and check if it matches an installed program. If it does, call that program's run method with a callback to add the input back to the end.
  -func replace (str message, str ...) : str // replace the placeholders in the string with the additional variables supplied. Won't do anything when too many variables are supplied.
  -func loadSound (id, url, cb) : null // get a sound ready to play (executes the cb when ready to play)
  func playSound (id, url, vol, looping) : null // play a sound. If it doesn't exist, load it automatically
  func pauseSound (id) : null // pause a playing sound
  -func fitIn (str text, int length) : str the text fit inside the space. If it overflows, replace the last characters with ellipsis. If it it's smaller, add spaces to fill the char #.
  -func getTemplate (str id) : dom the HTML of the template // polyfill browsers that don't support templates.

Program
  str  lastWriteId : str id of the last ln we created
  func newln () : str id to write to
  func run (args, cb) : null // executes cb when finished
  func cleanArgs (args) : array cleaned up args for use when running program
    help
    whoami
    list
    go
    open
    install
    hypermsg

File
  str  parent : the file's parent
  str
  str  type : str file/folder // may add more types, not sure
  func access (options, cb) : array || str // returns a string with the contents of the file or an array of the children if it's a directory. Maybe accepts options, depending on the thing

-Note
  -int  lastX & lastY // last place that it was dropped (needed to keep dragging working)
  -str  content // the content of the string
  -func drag () : // move the note around
  -func remove () : null // remove the note from the screen
*/

var app = function () {

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
        chars = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
    for (var i=0; i < length; i++) {
      id += chars[Math.floor(Math.random() * 16)];
    }
    if ( gtById(id) ) {
      return uniqueId(); // recursive hnnnng
    } else {
      return id;
    }
  };

  // ---------------- Variables ------------------- //

  var inputTemplate = getTemplate('input-template'), // Template for the input
      lnTemplate = getTemplate('ln-template'), // Template for a new line
      term = gtById('terminal'), // The terminal in the DOM. This shouldn't go anywhere, so this won't have to be updated.
      debug = true,
      installed = {},
      notes = [],
      errorMsgs = {};

  // -------------- Base Functions ---------------- //

  var init = function () {
    appendInput();
    gtById('input').focus();
    var out = appendOutput();
    out.innerHTML = 'Welcome!';
    appendInput();
  };

  // When called, gets input from the field (if any) and calls the appropriate program, passing it token-ized arguments.
  var parseInput = function (input) {
    inputEl = gtById('input');
    input = inputEl.value;
    if (input) {
      var tokens = input.split(' ');
      if ( installed[tokens[0]] ) {
        installed[tokens[0]]
      } else {
        log('oops');
      }
    }
  };

  // Appends a new output div with a unique ID. Returns a reference to the DOM node for further manipulation.
  var appendOutput = function () {
    var ln = lnTemplate.querySelector('.shell-ln'),
        id = uniqueId();
    gtById('shell').parentNode.removeChild(gtById('shell'));
    ln.id = id;
    term.appendChild(ln);
    return ln;
  }

  // Usually called from the callback for programs; gives the user input ability after programs are finished running.
  var appendInput = function () {
    inputTemplate = getTemplate('input-template');
    term.appendChild(inputTemplate);
  };

  // Replace the keywords in a string, similar to PHP's `sprintf`.
  var keywordReplace = function (string, values) {
    var values = values || {}, i=1;
    for (var val in values) {
      string = string.replace('%'+i, val);
    }
    return string;
  };

  var fitInStr = function (str, length) {
    if ( str.length > length && str.charAt(str.length - 1) !== ' ' ) { // Watch that trailing space
      // Put a .. on the end to show it trailing off if it's too long
      return str.substr(str.length - 3, 2) + '..';
    } else {
      // Lengthen the string with ' ' until it meets the number of characters required
      var whitespace = " ";
      while ( whitespace.length < length - str.length ) { whitespace += " " };
      return str.contat(whitespace);
    }
  };

  // Sound "engine". Collection of functions for loading, playing and pausing sounds. Can also interrupt sounds.
  var loadSound = function (id, url, cb) {
    if ( gtById(id) ) { cb(id); return; }

    cb(id);
  };

  init();


  var getData = function (query, cb) {
    var request = new XMLHttpRequest ();
    request.onload = cb;
    request.open('get', window.location.href + 'get.php?' + query, true);
    request.send();
  };

  var saveState = function () {
    log( JSON.stringify( gameState ) );
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

    that.display = function () {
      var note = template.querySelector('.note');
      window[my.name].dragClickX = 0;
      window[my.name].dragClickY = 0;
      window[my.name].dragOffsetX = 0;
      window[my.name].dragOffsetY = 0;

      var noteText = document.createElement('p');

      noteText.innerHTML = my.text;
      note.appendChild(noteText);
      note.id = id;
      term.appendChild(note);

      note.addEventListener('mousedown', function (event) {
        window[my.name].dragClickX = event.x;
        window[my.name].dragClickY = event.y;
        window.addEventListener('mousemove', window[my.name].drag);
        document.body.classList.add('dragging');
      });
      note.addEventListener('mouseup', function () {
        window[my.name].dragClickX = undefined;
        window[my.name].dragClickY = undefined;
        window[my.name].dragOffsetX = parseInt(this.style.transform.match(/translateX\((-?[0-9]{1,})px\)/)[1]);
        window[my.name].dragOffsetY = parseInt(this.style.transform.match(/translateY\((-?[0-9]{1,})px\)/)[1]);
        window.removeEventListener('mousemove', window[my.name].drag);
        document.body.classList.remove('dragging');
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

  var gameState = {
    programs: {
      open: {
        name: 'open'
      }
    }
  };

  startNote = Note({ // declared globally on purpose
    name: 'startNote',
    text: 'CHECK MESSAGES',
    removable: true
  });

  startNote.display();

};

window.requestAnimationFrame(app);


/* Old crappy code --------------------------------------------------------------------------------------------------

var terminal = function () {
  "use strict";
  var sep = function () {
    return "<hr>";
  };

  var commands = {
    help: {
      man: 'Displays information about installed programs, or lists all programs if none is supplied.',
      run: function (options) {
        if (options[1] === undefined) {
          var output = 'Available programs:<br>';
          for (var cmd in commands) {
            output += '  ' + cmd + '<br>';
          }
          output += 'To learn more about a program, type help [programname]';
          return output;
        } else {
          if (typeof commands[options[1]] == 'object') {
            return options[1] + ': ' + commands[options[1]].man;
          } else {
            return 'Program not found: ' + options[1];
          }
        }
      }
    },
    whoami: {
      man: 'Describe the currently logged-in user.',
      run: function (options) {
        return 'Current user: r@ch<br>';
      }
    },
    list: {
      man: 'List files in the current directory.',
      run: function (options) {
        var output = "";
        for (var file in directories) {
          if (typeof directories[file] == "string") {
            output += "File: " + file + "<br>";
          } else {
            output += "Dir:  " + file + "<br>";
          }
        }
        return output;
      }
    },
    open: {
      man: 'Open a file. Usage: open [filename]',
      run: function (options) {
        if (options[1] !== undefined) {
          if (typeof directories[options[1]] == "string") {
            return directories[options[1]];
          } else {
            return "Err: File does not exist or is a directory."
          }
        } else {
          return "Usage: open [filename]"
        }
      }
    },
    install: {
      man: 'Installs programs. Usage: install [netloc of program]',
      run: function (options) {
        if ( options[1] && options[1].match("^net://") ) {
          for (var prog in netCommands) {
            if (netCommands[prog].net == options[1]) {
              commands[prog] = netCommands[prog];
              //installAnimation(options[1]);
              return 'Installed '+options[1];
            }
          }
          return 'Err: program not found at specified netloc';
        } else {
          return 'Usage: install [net url of program]';
        }
      }
    },
  };

  var secretCommands = {
    go: {
      man: 'Move to the specified location.<br>Usage: go [path/to/location]<br>Use .. to represent the parent directory; e.g. to go up one directory, type go ..',
      run: function (options) {
        if (options[1] !== undefined) {
          var dest = options[1].split("/");
          var wd = env.path();
          return "";
        } else {
          return 'Usage: go [path/to/location]';
        }
      }
    },
  };

  var netCommands = {
    hypermsg: {
      net: 'net://af4d:649e:b231/hypermsg',
      man: 'Read messages in your netbox.<br>Usage:<br>hypermsg (list all messages)<br>hypermsg read [msgid]',
      messages: {
        '01': {
          author: 'LaKellz',
          date: '2031-02-14',
          title: 'Hey r',
          msg: 'Heard about your rig. Sux. Net me later, K? I have a job you might be interested in.'
        },
        '02': {
          author: 'LaKellz',
          date: '2031-02-13',
          title: 'Your recent hardware failure',
          msg: 'It has come to the attention of Raidman Warez Inc. that you have experienced a fault while using one of our products.<br><br>While we deeply regret this, records recovered from the logchip in your Raidman Warez Embed&trade; show that the device was being overclocked at the time of failure.<br><br>This is a voilation of the warranty, and as a result we cannot refund or replace your hardware purchase.<br><br>We apologize for any inconvenience.'
        },
      },
      run: function (options) {
        if (options[1] == undefined) {
          return this.allMsg();
        } else if (options[1] == 'read' && this.messages[options[2]]) {
          return sep() + "<strong>Message: "+ this.messages[options[2]].title + "</strong><br>" + this.messages[options[2]].msg;
        } else {
          return 'Usage: hypermsg read [msg id]'
        }
      },
      allMsg: function () {
                         //0    5           17            30
        var output = sep()+'<strong>ID  Date        Author        Title</strong><br>';
        for (var msg in this.messages) {
          var row = msg + '  ' + this.messages[msg].date + '  ' + this.messages[msg].author + this.spc(this.messages[msg].author.length, 14) + this.messages[msg].title + '<br>';
          output += row;
        }
        return output;
      },
      spc: function (length, space) {
        var output = '';
        for (var i=0; i<space-length; i++) {
          output += ' ';
        }
        return output;
      }
    }
  };

  var env = {
    wd: "",
    path: function () {
      return this.wd.split("/");
    },
  };

  var directories = {
    "hyper_readme": sep() + 'To re-install hypermessage:<br>  1. Use the installer program to install hypermsg from net://af4d:649e:b231/hypermsg<br>  2. Verify the installation by typing "hypermsg"',
    "documents": {
      "doc": "Testing",
    }
  };
};

requestAnimationFrame(terminal); */
