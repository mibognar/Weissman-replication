function read_presets(){
  var select = document.getElementById('type_selector');
  select.length = 0;

  let defaultOption = document.createElement('option');
  defaultOption.text = "Select experiment type to run on server";
  select.add(defaultOption);
  select.selectedIndex = 0;

  const url = "admin_setup/presets.json";
  const request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.onload = function() {
    if (request.status === 200) {
      console.log("Status OK");
      const data = JSON.parse(request.responseText);
      console.log(data);
      let option;
      for (let i = 0; i < data.types.length; i++) {
        option = document.createElement('option');
        option.text = data.types[i].name;
        option.value = data.types[i].type;
        select.add(option);
        console.log("option added");
      }
     }
  }
  request.onerror = function() {
  console.error('An error occurred fetching the JSON from ' + url);
}
request.send();
}
function save_preset(){
  var new_preset = document.getElementById("type_selector").value;
  const postRequest = new XMLHttpRequest();
  const saveurl = "admin_setup/save_preset.php";
  postRequest.open('POST', saveurl, true);
  postRequest.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  postRequest.onreadystatechange = function() {
    if(postRequest.readyState == 4 && postRequest.status == 200) {
        window.location.href = "../";
    }
  }
postRequest.send(new_preset);
alert("New Setup Saved: " + new_preset);
}
read_presets();
