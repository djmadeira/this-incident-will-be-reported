<?php
header('Content-Type: text/json');

if (isset($_GET['high']) && $_GET['high'] === 'low') { ?>
{
  "total": "pwnage man!"
}
<?php } else { ?>
{
  "err": "not found"
}
<?php } ?>
