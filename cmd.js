var terminal = function (undefined) {
  "use strict";

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
      return 'ERR: Please use a valid command name (hint: try \'help\')';
    }
  }

  var sep = function () {
    return "<hr>";
  }

  var term = document.getElementById('terminal'),
      shell,
      shellInput;

  var commands = {
    help: {
      man: 'Displays information about installed programs, or lists all programs if none is supplied.',
      run: function (options) {
        if (options[1] == null) {
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
        return 'User undefined running on Delta Softworks, LLC - Grid09Srv42';
      }
    },
    list: {
      man: 'List files in the current directory',
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
      man: 'Open a file',
      run: function (options) {
        if (options[1] !== null) {
          if (typeof directories[options[1]] == "string") {
            return directories[options[1]];
          } else {
            return "File does not exist or is a directory."
          }
        } else {
          return "Usage: open [filename]"
        }
      }
    }
  };

  var secretCommands = {
    invisible: function (options) {

    }
  }

  var directories = {
    "notes": sep() + "I should really try to write things down more. I forgot that last time I logged onto the Weyland mainframe I nearly lost a program to that GRIM." + sep(),
    "documents": {
      "doc": "Testing",
    }
  }

  appendInput();

};

requestAnimationFrame(terminal);
