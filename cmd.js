/**
  * Way to view source bro/sis! Here's a rundown of how it works:
  * derp derp hax quick solution half-assed thing derp herp derp.
  * Don't look, unless you were looking for a manual on how *not* to write code.
**/

/*
App
  dom  template // the template for the terminal
  dom  lntemplate // the template for a new line
  bool debug // whether debugging or not
  obj  installed // installed programs (accessable by player)
  obj  notes // Currently displayed notes
  obj  err // key: values for errors of a certain type. Regex for %1 etc to replace if needed
  func gtById (str id) : dom id || null // alias for document.getelementbyid
  func log (msg) : null // alias for console.log (if debug flag enabled)
  func parseInput (str input) : // sanitize input and check if it matches an installed program. If it does, call that program's run method with a callback to add the input back to the end.
  func replace (str message, str ...) : str // replace the placeholders in the string with the additional variables supplied. Won't do anything when too many variables are supplied.
  func loadSound (id, url, cb) : null // get a sound ready to play (executes the cb when ready to play)
  func playSound (id, url, vol, looping) : null // play a sound. If it doesn't exist, load it automatically
  func pauseSound (id) : null // pause a playing sound
  func fitIn (str text, int length) : str the text fit inside the space. If it overflows, replace the last characters with ellipsis. If it it's smaller, add spaces to fill the char #.
  func getTemplate (str id) : dom the HTML of the template // polyfill browsers that don't support templates.

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

Note
  int  lastX & lastY // last place that it was dropped (needed to keep dragging working)
  str  content // the content of the string
  func drag () : // move the note around
  func remove () : null // remove the note from the screen
*/

var terminal = function () {
  "use strict";
  var term = document.getElementById('terminal'),
      termWrap = document.getElementById('term-wrap'),
      shell,
      shellInput,
      noteTemplate = document.getElementById('note-template'),
      noteRemovableTemplate = document.getElementById('note-removeable-template'),
      currentId = 'uniqueid0',
      clickX,
      clickY,
      dragOffsetX,
      dragOffsetY,
      dragTarget;

  var appendInput = function () {
    if (document.getElementById('shell') == null) {
      // First-time setup
      shell = document.getElementById('shell-template').content.cloneNode(true);
      term.appendChild(shell);
    } else {
      var shell = document.getElementById('shell');
      var shellCopy = shell.cloneNode(true);
      shell.remove();
      shellCopy.querySelector('input').value = '';
      term.appendChild(shellCopy);
    }
    var shell = document.getElementById('shell');
    shellInput = document.getElementById('shell-input');
    shellInput.focus();
    shell.addEventListener('keydown', function (event) {
      if (event.keyIdentifier === 'Enter') {
        submitInput();
      }
    });
  }

  var submitInput = function () {
    var output = document.getElementById('shell-line-template').content.cloneNode(true);
    output.querySelector('.shell-line').innerHTML = parseInput(shellInput.value);
    term.appendChild(output);
    appendInput();
  }

  var parseInput = function (input) {
    input = input.toLowerCase();
    var tokens = input.split(' ');
    if (typeof commands[tokens[0]] == 'object') {
      return commands[tokens[0]].run(tokens);
    } else {
      if (typeof secretCommands[tokens[0]] == 'object') {
        commands[tokens[0]] = secretCommands[tokens[0]];
        return 'Program "'+tokens[0]+'" installed.';
      }
      return 'ERR: Please use a valid program name (try "help")';
    }
  }

  var sep = function () {
    return "<hr>";
  };

  var addNote = function (noteBody, removable) {
    if (removable == undefined || removable == true) {
      var note = noteRemovableTemplate.content.querySelector('.note').cloneNode(true);
    } else {
      var note = noteRemovableTemplate.content.querySelector('.note').cloneNode(true);
    }
    var noteText = document.createElement('p');
    noteText.innerHTML = noteBody;
    note.appendChild(noteText);

    note.addEventListener('mousedown', function (event) {
      playSound('stickyremove.mp3', 'fg', 0.2, false);
      clickX = event.x;
      clickY = event.y;
      window.addEventListener('mousemove', draggable);
      dragTarget = this;
      document.body.classList.add('dragging');
    });
    note.addEventListener('mouseup', function () {
      clickX = undefined;
      clickY = undefined;
      dragOffsetX = parseInt(this.style.transform.match(/translateX\((-?[0-9]{1,})px\)/)[1]);
      dragOffsetY = parseInt(this.style.transform.match(/translateY\((-?[0-9]{1,})px\)/)[1]);
      window.removeEventListener('mousemove', draggable);
      document.body.classList.remove('dragging');
    });

    note.querySelector('.note-remove').addEventListener('click', function () {
      this.parentNode.parentNode.removeChild(this.parentNode);
      shellInput.focus();
    });
    termWrap.appendChild(note);

  };

  var draggable = function (e) {
    var transValue = "translateX(" + (e.x - clickX + (dragOffsetX ? dragOffsetX : 0)) + "px) translateY(" + (e.y - clickY + (dragOffsetY ? dragOffsetY : 0)) + "px)";
    dragTarget.style.transform = transValue;
    dragTarget.style.webkitTransform = transValue;
  };

  var playSound = function (url, layer, vol, loop) {
    if (layer == 'bg') {
      var playing = document.getElementById('music-bg');
      playing.querySelector('source').src = url;
    } else {
      var playing = document.getElementById('music-fg');
      playing.querySelector('source').src = url;
    }
    playing.loop = loop ? true : false;
    playing.volume = vol || 1;
    playing.load();
    playing.play();
  }

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

  appendInput();
  addNote('CHECK MESSAGES');
  //playSound('bg-ambient.mp3', 'bg', 0.1, true);
};

requestAnimationFrame(terminal);
