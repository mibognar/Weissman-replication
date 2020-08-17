<!DOCTYPE html>
<html>
  <head>
      <meta charset="UTF-8">
      <title>Weissman Admin Page</title>
      <link rel="stylesheet" href="style/main.css"/>
  </head>
  <body tabindex="0">
  <section class="Container">
      <div id="Content">
        <div id="Demographics" class="instructions">
            <h1>Experiment Selector</h1>
            <form onsubmit="admin()">
              <div>
                  <div>
                      <select name="type_selector" id="type_selector">
                      </select>
                  </div>
                  <script src="admin_setup/read_presets.js" charset="utf-8"></script>
                  <div>
                      <button type="button" name="button" onclick="save_preset()">SUBMIT</button>
                  </div>
              </div>
            </form>
        </div>
      </div>
  </section>
  </body>
</html>
