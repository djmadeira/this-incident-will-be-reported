/**
  * Way to view source friend! Here's a rundown of how it works:
  * derp derp hax quick solution half-assed thing derp herp derp.
  * Don't look, unless you were looking for a manual on how *not* to write code.
**/

/**
 * Boring Polyfills
 */
window.requestAnimationFrame = window.requestAnimationFrame ||
  window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||
  function (func) {
    window.setTimeout(func, 33); // 30 FPS
  };
var webcomponentsPolyfill = require('polyfill-webcomponents');

var cmd = { run: function () {
  "use strict";
  var inputTemplate, // Template for the input
      lnTemplate, // Template for a new line
      term, // The terminal in the DOM. This shouldn't go anywhere, so this won't have to be updated.
      input,
      debug,
      notes,
      errorMsgs,
      muted = false;

  var init = function () {
    inputTemplate = getTemplate('input-template');
    lnTemplate = getTemplate('ln-template');
    term = gtById('terminal');
    input;
    debug = true;
    notes = [];
    errorMsgs = {};

    gtById('save').addEventListener('click', saveGame);
    gtById('load').addEventListener('click', loadGame);
    gtById('mute').addEventListener('click', toggleMute);

    appendInput();
    focusInput();
  };

  /**
   * Utility functions
   */
  // getElementById wrapper
  var gtById = function (id) {
    return document.getElementById(id);
  };

  // console.log wrapper
  var log = function (msg) {
    if ( debug ) { console.log(msg); }
  };

  // Gets a copy of a template
  var getTemplate = function (id) {
    var template = gtById(id);
    if ( ! template ) { return false; }
    return template.content.cloneNode(true);
  };

  // Generate a unique, hexy ID (move that hexy bod grrl)
  var uniqueId = function uniqueId () {
    var id = '',
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

  // When called, gets input from the field (if any) and calls the appropriate program, passing it token-ized arguments.
  var parseInput = function () {
    var val = input.value;
    if (val) {
      var tokens = val.split(' ');
      if ( state.installed.indexOf(tokens[0]) != -1 ) {
        var commandHistory = appendOutput();
        commandHistory.innerHTML = '<span class="said-command">$ ' + input.value + '</span>';
        programs[tokens[0]].run(tokens);
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
        id = uniqueId(),
        shell = gtById('shell');
    if (shell) {
      gtById('shell').parentNode.removeChild(gtById('shell'));
    }
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
    for (var i=0; i < values.length; i++) {
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
      var whitespace = "";
      while ( whitespace.length < length - str.length ) { whitespace += " " };
      return str + whitespace;
    }
  };

  var breakAtLength = function (str, length, column) {
    var newStr = '';
    if ( str.length > length ) {
      var i = 0, offset = '';
      while (i != null) {
        if (column && i > 0) {
          offset = fitInStr('', column * length);
        }
        newStr += offset +  str.substring( i * length, i * length + length ) + '\n';
        i++;
        if ( i * length > str.length ) {
          break;
        }
      }
    } else {
      newStr = fitInStr(str, length);
    }
    return newStr;
  }

  var tableLayout = function (data) {
    var width = data.width || 28,
        columnCount = data.rowCount || 2,
        output = '',
        separator = data.separator || '|';
    for (var i=0, j=data.titles.length; i<j; i++) {
      output += fitInStr(data.titles[i], width);
    }
    output += '\n';
    for (var i=0, j=data.rows.length; i<j; i++) {
      var row = data.rows[i];
      for (var k=0, l=row.length; k<l; k++) {
        output += breakAtLength(row[k], width, k);
      }
    }
    return output;
  };

  var usageTable = function (rows) {
    return tableLayout({
      columns: 2,
      width: 29,
      titles: [
        'Usage',
        'Description'
      ],
      rows: rows
    })
  }

  var spc = function () {
    return '<span class="spc"></span>';
  }

  var loadSound = function (file, options, cb) {
    options = options || {},
    cb = cb || function () {};
    var audio = gtById(options.id);
    if (audio) {
      audio.load();
      return cb(audio);
    }
    audio = document.createElement('audio');
    audio.id = options.id;
    audio.src = 'sound/' + file;
    audio.loop = options.loop ? true : false;
    audio.volume = options.volume || 1;
    document.body.appendChild(audio);
    return cb(audio);
  };

  var playSound = function (id, options, cb) {
    options = options || {},
    cb = cb || function () {};
    var audio = gtById(audio);
    if (audio) {
      audio.loop = options.loop ? true : false;
      audio.volume = options.volume || 1;
      audio.play();
      return cb(audio);
    }
    return cb(new Error('Track not found.'));
  }

  var toggleMute = function () {
    muted = !muted;
    var els = document.getElementsByTagName('audio');
    for (var i=0, j=els.length; i < j; i++) {
      els[i].muted = muted;
    }
  }

  var saveGame = function () {
    var saveGame = {};
    saveGame.state = state;
    saveGame.wd = wd;
    saveGame.net = net;
    alert( "Save this text somewhere:\n\n" + JSON.stringify( saveGame ) );
  };

  var loadGame = function () {
    var saveGame = JSON.parse(prompt('Paste your save game here:'));
    state = saveGame.state;
    wd = saveGame.wd;
    net = saveGame.net;
  };

  /**
   * Object constructors
   */
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

  var File = function (my) {
    var my = my || {},
        that = {};

    that.type = my.type || 'text';
    that.access = my.access;
    that.content = my.content;

    return that;
  };

  var FileProgram = function (my) {
    var my = my || {},
        that = File({
          type: 'program'
        });

    that.programName = my.programName;

    return that;
  };

  init();

  var state = {
    installed: ['help', 'whoami', 'list', 'install'],
    user: 'rachel',
    wd: 'local'
  };

  var wd = {
    'local': {
      'read.pg': FileProgram({
        programName: 'read'
      }),
      'crash.log': File({
        content: '2031/05/16 22:31 CRITICAL FAILURE: Connection terminated by host. Significant electrical damage detected. Emergency recovery mode active...\n'+ spc() +'\
2031/05/16 22:42 Systems diagnostics completed.\n\
CPU: 3/12 cores operational, cycles unstable, quantum state integrity check passed.\n\
MEM: 3QB active, 152 sectors damaged, 48 OK.\n\
Databanks: 19683QB checked, 8219QB passing, 9921QB recoverable, 1543QB irreparable.\n\
To recover damaged data, install the Databank Recovery Tool&reg;: net://downloadportal.cyberdynesystems.corp/softwaretools?92757273135337173'
      })
    }
  };

  var net = {
    'net://downloadportal.cyberdynesystems.corp/softwaretools?92757273135337173': FileProgram({
      programName: 'recoverytool'
    })
  };

  var programs = {};

  var err = {
    noOutput: "This program has no output function (that's a bug)",
    cmdNotFound: "Err: program does not exist (try \"help\")"
  }

  window.setTimeout(function () {
    window.startNote = Note({ // declared globally on purpose
      name: 'startNote',
      text: 'smashthestate',
      removable: true
    });
    startNote.display();
  }, 5000);

  loadSound('hdd-startup.mp3', {id: 'hdd-startup', loop: false, volume: 0.2}, function (audio) {
    audio.play();
    audio.addEventListener('ended', function () {
      gtById('hdd-loop').play();
    })
  });
  loadSound('hdd-loop.mp3', {id: 'hdd-loop', loop: true, volume: 0.3});

  loadSound('ambient-city.mp3', {id: 'city-ambient', loop: true, volume: 0.04}, function (audio) {
    audio.play();
  });

  loadSound('music-brooding.mp3', {id: 'brooding-music', loop: true, volume: 0.24}, function (audio) {
    audio.play();
  });

  programs.help = Program({
    desc: "Displays info about installed programs.",
    use: usageTable([ ['help', 'List all installed programs.'], ['help program', 'Where "program" is the name of an installed program. Display instructions for the program.'] ]),
    process: function (input, lnout, cb) {
      if ( input[0] ) {
        if ( programs[input[0]] ) {
          lnout.innerHTML = 'Description:\n'+ programs[input[0]].desc + spc() + programs[input[0]].use;
        } else {
          lnout.innerHTML = 'Program "'+ input[0] +'" not found.';
        }
      } else {
        var print = "Installed programs:\n" + spc();
        for (var program in programs) {
          if ( state.installed.indexOf(program) != -1 ) {
            print += program +'\n';
          }
        }
        print += spc() + 'For instructions on using a program, type "help program", where "program" is an installed program.'
        lnout.innerHTML = print;
      }
      cb();
    }
  });

  programs.whoami = Program({
    desc: 'Displays info about the current user.',
    use: 'Usage:\nwhoami',
    process: function (input, lnout, cb) {
      lnout.innerHTML = state.user;
      cb();
    }
  });

  programs.install = Program({
    desc: 'Install programs from a .pg file or netloc.',
    use: usageTable([ ['install loc', 'Where "loc" is a netloc of a program to install (e.g. net://file.pg).'], ['install file.pg', 'Where "file.pg" is the name of a .pg file in the working directory.'] ]),
    process: function (input, lnout, cb) {
      if (!input[0]) {
        lnout.innerHTML = this.use;
        return cb();
      }
      var file = wd[state.wd][input[0]] || net[input[0]];
      if ( file ) {
        if (file.type == 'program') {
          state.installed.push(file.programName);

          var anim = getTemplate('install-animation-template');
          lnout.appendChild(anim);
          var el = document.createElement('span');
          el.innerHTML = 'Program "' + file.programName + '" installed successfully.';

          window.setTimeout(function (cb, lnout, el) {
            lnout.appendChild(el);
            cb();
          }, 2000, cb, lnout, el);
        } else {
          lnout.innerHTML = 'ERR: file "'+input[0]+'" is not a program.';
          cb();
        }

      } else {
        lnout.innerHTML = 'Program "' + input[0] + '" not found.';
        cb();
      }
    },
  });

  programs.list = Program({
    desc: 'List files in the working directory.',
    use: usageTable([ ['list', 'List all files in the working directory'] ]),
    process: function (input, lnout, cb) {
      var output = "";
      for (var file in wd[state.wd]) {
        output += file + '\n';
      }
      lnout.innerHTML = output;
      cb();
    }
  });

  programs.read = Program({
    desc: 'Read files in the working directory.',
    use: usageTable([ ['read file', 'Where "file" is the name of a file in the working directory (try "list" to see files).'] ]),
    process: function (input, lnout, cb) {
      if ( ! input[0] ) {
        lnout.innerHTML = this.use;
      } else {
        var file = wd[state.wd][input[0]];
        if ( file ) {
          if (file.type == 'text') {
            lnout.innerHTML = file.content;
          } else {
            lnout.innerHTML = 'ERR: file "'+ input[0] +'" is not a text file.';
          }
        } else {
          lnout.innerHTML = "File not found: " + input[0];
        }
      }
      cb();
    }
  });

  programs.recoverytool = Program({
    desc: 'Repair damaged Databank cells.'+ spc() +'This courtesy software is provided to you by Cyberdyne Systems&reg; free of charge, although certain terms and conditions apply (you can find out more about our datascanning policies on our netportal.)',
    use: usageTable([ ['recoverytool', 'Recover damaged data.'] ]),
    process: function (input, lnout, cb) {
      if (this.recovered) {
        lnout.innerHTML = 'Data already recovered.';
        state.installed.splice(state.installed.indexOf('recoverytool'), 1);
      } else {
        this.recovered = true;
        wd.local['netmonkey.pg'] = FileProgram({
          programName: 'netmonkey'
        });
        lnout.innerHTML = 'Data recovered.';
      }
      cb();
    }
  });

  programs.netmonkey = Program({
    desc: 'Connect to the tornet and view directories and message boards.',
    use: '',
    process: function (input, lnout, cb) {
      cb();
    }
  });

}};

requestAnimationFrame(cmd.run);
