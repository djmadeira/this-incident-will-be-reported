var terminal = function (undefined) {
  "use strict";

  var term = document.getElementById('terminal'),
      shell,
      shellInput;

  var commands = {
    help: {
      man: 'Displays a full list of programs.',
      run: function (options) {
        var output = 'Available programs:<br>';
        for (var cmd in commands) {
          output += cmd + '<br>';
        }
        return output;
      }
    },
    man: {
      man: 'Displays information about a program. Usage: man [programname]',
      run: function (options) {
        if (options[1] !== undefined && typeof commands[options[1]] == 'object') {
          return commands[options[1]].man;
        } else {
          return 'Usage: man [programname]'
        }
      }
    },
    whoami: {
      man: 'Describe the currently logged-in user.',
      run: function (options) {
        return 'User undefined running on Delta Softworks, LLC - Grid09Srv42';
      }
    }
  };

  var secretCommands = {
    invisible: function (options) {

    }
  }

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
    var tokens = input.split(' ');
    if (typeof commands[tokens[0]] == 'object') {
      return commands[tokens[0]].run(tokens);
    } else {
      return 'ERR: Please use a valid command name (hint: try \'help\')';
    }
  }

  appendInput();

};

requestAnimationFrame(terminal);
