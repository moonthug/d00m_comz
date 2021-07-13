(function() {
  let socket;

  //
  // UI
  const $connectionFieldset = document.getElementById('connection');
  const $connectButton = document.getElementById('connect');
  const $url = document.getElementById('url');
  const $token = document.getElementById('token');

  const $commandsFieldset = document.getElementById('commands');
  const $command = document.getElementById('command');
  const $message = document.getElementById('message');
  const $send = document.getElementById('send');

  const $messages = document.getElementById('messages');


  //
  // Helpers
  function createMessage(direction, event) {
    const icon = direction === 'in' ? '💌' : '📮';
    const action = event.action || event.event;

    const template = document.createElement('template');

    let body = '';
    switch (action) {
      case 'message':
      case 'send-message':
        body = event.data.message;
        break;
      case 'users':
      case 'list-users':
        if (direction === 'in') {
          body = event.data.users
            .map(user => '👩‍💻 ' + user.name + ' [' + user.lastSeen + ']')
            .join('<br/>')
        }
        break;

      case 'chat-history':
        if (direction === 'in') {
          body = event.data.messages
            .map(message => message.fromUserId + ': ' + message.message)
            .join('<br>');
        }
    }

    template.innerHTML =
      '<div class="list-group-item list-group-item-action" aria-current="true">\n' +
      '  <div class="d-flex w-100 justify-content-between">\n' +
      '    <h5 class="mb-1">' + icon + ' ' + action + '</h5>\n' +
      '    <small>' + (new Date()).toISOString() + '</small>\n' +
      '  </div>\n' +
      '  <p class="mb-1">' + body + '</p>\n' +
      '  <small class="font-monospace text-muted">' + JSON.stringify(event) + '</small>\n' +
      '</div>';

    $messages.appendChild(template.content.firstChild);
  }

  //
  // Socket Events
  function onOpen() {
    $connectionFieldset.setAttribute('disabled', '');
    $commandsFieldset.removeAttribute('disabled');
  }

  function onClose() {
    $connectionFieldset.removeAttribute('disabled');
    $commandsFieldset.setAttribute('disabled', '');
  }

  function onMessage(event) {
    const message = JSON.parse(event.data);
    createMessage('in', message);
  }

  function bindEvents() {
    socket.addEventListener('open', onOpen);
    socket.addEventListener('close', onClose);
    socket.addEventListener('message', onMessage);
  }

  //
  // Add listeners
  $connectButton.addEventListener('click', event => {
    const url = $url.value + '?token=' + $token.value;
    console.debug(`Connect to ${url}`);
    socket = new WebSocket(url);
    bindEvents(socket);
  });

  $command.addEventListener('change', event => {
    if (event.target.value === 'send-message') {
      $message.removeAttribute('disabled');
    } else {
      $message.setAttribute('disabled', '');
    }
  });

  $send.addEventListener('click', event => {
    const payload = {
      action: $command.value
    };

    if ($command.value === 'send-message') {
      payload.data = {
        message: $message.value
      }
    }

    socket.send(JSON.stringify(payload));
    createMessage('out', payload);
  });
})();
