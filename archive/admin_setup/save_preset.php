<?php
$json_data = [
  'online_preset' => file_get_contents('php://input')
];
$data =json_encode($json_data);
file_put_contents('online_setup.json', $data);
echo $data;
 ?>
