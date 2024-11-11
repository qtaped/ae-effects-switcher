(function effectSwitcher(thisObj) {
  /* Build UI */
  function buildUI(thisObj) {
    var windowTitle = "Effect Switcher";
    var win = (thisObj instanceof Panel)? thisObj : new Window('palette', windowTitle);
    win.spacing = 8;
    win.margins = 8;

    var tab = win.add("tabbedpanel");
    tab.alignChildren = "fill";

// Tab 1 - Effects Switcher

    var tab1 = tab.add("tab", undefined, "Effects Switcher");

    var containerOneGroup = tab1.add("group");
    containerOneGroup.spacing = 8;
    containerOneGroup.orientation = "column";
    containerOneGroup.alignChildren = ["fill", "center"];

    // Margin trick. Empty Text.
    containerOneGroup.add("statictext", [32, 0, 296, 2], " ");

    // Text line filter
    var filterTextLine = containerOneGroup.add("statictext", undefined, "Effect name(s) containing:");
    
    // Input field for effect names
    var effectNamesInput = containerOneGroup.add("edittext", undefined, "Glow, Levels, Blur");
    effectNamesInput.characters = 24;

    // Buttons group 1
    var buttonsGroupOne = containerOneGroup.add("group");
    buttonsGroupOne.spacing = 8;
    buttonsGroupOne.orientation = "row";
    buttonsGroupOne.alignChildren = ["fill", "center"];

    // Filter buttons
    var searchEffectsButton = buttonsGroupOne.add("button", undefined, "Search");
    var autoFillButton = buttonsGroupOne.add("button", undefined, "Autocomplete");
    var clearButton = buttonsGroupOne.add("button", undefined, "Clear");

    // Exact terms
    var exactCheckbox = containerOneGroup.add("checkbox", undefined, "Exact terms only");

    // Select All Comps
    var searchAllCompsCheckbox1 = containerOneGroup.add("checkbox", undefined, "Select All Compositions");

    // Margin trick. Empty Text.
    containerOneGroup.add("statictext", [32, 0, 296, 2], " ");

    // Text line for messages (comps selected, errors, ...)
    var compSelectedTextLine = containerOneGroup.add("statictext", undefined, "", {
      multiline: true,
      scrolling: true,
    });
    compSelectedTextLine.alignment = "fill";
    var compSelectedMessage = "Select composition(s) in project panel then <Search>.";
    compSelectedTextLine.text = compSelectedMessage;

    // Buttons groups 2
    var buttonsGroupTwo = containerOneGroup.add("group");
    buttonsGroupTwo.spacing = 8;
    buttonsGroupTwo.orientation = "row";
    buttonsGroupTwo.alignChildren = ["fill", "center"];

    // Buttons for toggling effects
    var toggleEffectButton = buttonsGroupTwo.add("button", undefined, "Toggle");
    var enableSelectedButton = buttonsGroupTwo.add("button", undefined, "Enable");
    var disableSelectedButton = buttonsGroupTwo.add("button", undefined, "Disable");
    buttonsGroupTwo.enabled = false; // disabled buttons by default
    
    // Margin trick. Empty Text.
    containerOneGroup.add("statictext", [32, 0, 296, 12], " ");

    // StaticText to display array elements
    var effectTextLine = containerOneGroup.add("statictext", undefined, "", {
      multiline: true,
      scrolling: true,
    });
    effectTextLine.alignment = "fill";
    effectTextLine.preferredSize.height = 512;
    var effectMsgArray = [];


 /* Functions (tab 1) */

    function selectCompsToSearch() {

      var compsToSearch = [];

      if (searchAllCompsCheckbox1.value) {
        // Search in all compositions of the project
        for (var i = 1; i <= app.project.numItems; i++) {
          var item = app.project.item(i);
          if (item instanceof CompItem) {
            compsToSearch.push(item);
          }
        }
      } else {
        // Search only in selected items
        selectedComps = app.project.selection;
        for (var i = 0; i < selectedComps.length; i++) {
          var item = selectedComps[i];
          if (item instanceof CompItem) {
            compsToSearch.push(item);
          }
        }
      }

      return compsToSearch;

   }


    // Comp Selected Statistics
    function updateCompSelectedLine(message, msgColor) {

      compSelectedTextLine.text = message;

      if (msgColor === "red") {
        compSelectedTextLine.graphics.foregroundColor = compSelectedTextLine.graphics.newPen(compSelectedTextLine.graphics.PenType.SOLID_COLOR, [1, 0, 0], 1);
      } else if (msgColor === "blue") {
        compSelectedTextLine.graphics.foregroundColor = compSelectedTextLine.graphics.newPen(compSelectedTextLine.graphics.PenType.SOLID_COLOR, [0.2, 0.5, 0.9], 1);
      } else {
        compSelectedTextLine.graphics.foregroundColor = compSelectedTextLine.graphics.newPen(compSelectedTextLine.graphics.PenType.SOLID_COLOR, [0.8, 0.8, 0.8], 1) ;
      }
    }

    function updateEffectTextLine(msgColor) {
      effectTextLine.text = effectMsgArray.join("\n");
    }

    function clearEffectTextLine(newArray) {
      effectMsgArray = [];
      typeof newArray !== 'undefined' && effectMsgArray.push(newArray);
      updateEffectTextLine();
    }

    function processEffects(effectNames, action) {

    var compsToSearch = selectCompsToSearch();

      if (compsToSearch.length === 0) {
        updateCompSelectedLine("ERROR: Please select at least one composition.", "red");
        clearEffectTextLine("Select composition(s) in project panel or check 'Select All Compositions'.");
        buttonsGroupTwo.enabled = false;
        return;
      }

    // Filter Multiple Effects
    var arrayOfEffects = effectNames.split(", ");
    var totalCount = 0;

    for (var n = 0; n < arrayOfEffects.length; n++) {

      var selectedCompCount = 0;
      var effectCount = 0;
      var enabledCount = 0;
      var countToggled = 0;
      var globalCount = 0;

      var effectName = arrayOfEffects[n];

      for (var i = 0; i < compsToSearch.length; i++) {
        var comp = compsToSearch[i];

        if (!(comp instanceof CompItem)) continue;

        selectedCompCount++;

        var layers = comp.layers;

        for (var j = 1; j <= layers.length; j++) {
          var layer = layers[j];

          if (layer instanceof AVLayer || layer instanceof TextLayer || layer instanceof ShapeLayer) {

            for (var k = 1; k <= layer.effect.numProperties; k++) {
              var effect = layer.effect(k);

              globalCount++;

              if ((exactCheckbox.value) ? (effect.name.toLowerCase() === effectName.toLowerCase()) : (effect.name.toLowerCase().indexOf(effectName.toLowerCase()) !== -1)) {
                totalCount++;
                effectCount++;
                if (effect.enabled) {
                  enabledCount++;
                }

                if (action === "toggled") {
                  effect.enabled = !effect.enabled;
                  countToggled++;
                } else if (action === "enabled" && !effect.enabled) {
                  effect.enabled = true;
                  countToggled++;
                } else if (action === "disabled" && effect.enabled) {
                  effect.enabled = false;
                  countToggled++;
                }
              }

            }
          }
        }
      }

      if (!effectName) {
        effectName = "<Anything>";
      }


       if (countToggled > 0) {
        var toggleMessage = "→ " + effectName + " : " + countToggled +" effect(s) " + action + ".";
        effectMsgArray.push(toggleMessage);
      } else if (effectCount !== 0 && countToggled === 0 && action !== "" && action !== "search") {
        var toggleMessage = "→ " + effectName + " : already " + action + ".";
        effectMsgArray.push(toggleMessage);
      } else if (effectCount > 0) {
          var effectMessage = "→ " + effectName + " : "  + enabledCount + " / " + effectCount;
          effectMsgArray.push(effectMessage);
      } else {
          var effectMessage = "→ " + effectName + " : No effect found.";
          effectMsgArray.push(effectMessage);
      }


        updateEffectTextLine();


    } // end of effects array loop n


      // Count Comp Selected Message
    if (searchAllCompsCheckbox1.value) {
      var countMessage = "All Comps: " + selectedCompCount + " composition(s) with " + globalCount + " effect(s).";
      msgColor = "blue";
    }
    else {
      var countMessage = "Selected " + selectedCompCount + " composition(s) with " + globalCount + " effect(s).";
      msgColor = null;
    }

    updateCompSelectedLine(countMessage, msgColor = (globalCount === 0 || totalCount === 0) ? "red" : msgColor);

    // enable or disable buttons
    buttonsGroupTwo.enabled = totalCount != 0;
      

} // end of process function


// Function to list all effects found

var uniqueEffects = [];

function listOfAllEffects() {
  uniqueEffects = [];
  var compsToSearch = selectCompsToSearch();

    for (var i = 0; i < compsToSearch.length; i++) {
        var comp = compsToSearch[i];

        for (var j = 1; j <= comp.layers.length; j++) {
            var layer = comp.layers[j];
            if (layer instanceof AVLayer || layer instanceof TextLayer || layer instanceof ShapeLayer) {
              for (var k = 1; k <= layer.property("ADBE Effect Parade").numProperties; k++) {
                  var getEffectName = layer.property("ADBE Effect Parade").property(k).name;
                  if (!isEffectNameDuplicate(getEffectName)) {
                      uniqueEffects.push(getEffectName);
                  }
              }
            }
        }
    }

    // Sort the array of unique effect names alphabetically
    uniqueEffects.sort();

    effectNamesInput.text = uniqueEffects.join(", ");
}

// Function to check if an effect name is a duplicate
function isEffectNameDuplicate(getEffectName) {

    for (var i = 0; i < uniqueEffects.length; i++) {
        if (uniqueEffects[i] === getEffectName) {
            return true;
        }
    }
    return false;
}


  var defaultMsg = "Enter effect name(s) separated by a comma then <Search> or <Autocomplete> to search for all effect(s).";
  clearEffectTextLine(defaultMsg);


    searchEffectsButton.onClick = function () {
      var effectNames = effectNamesInput.text;
      (exactCheckbox.value) ? (searchMsg = "Effect name(s):") : (searchMsg = "Effect name(s) containing:");
      clearEffectTextLine(searchMsg + "\n");
      processEffects(effectNames, "search");
    };

    autoFillButton.onClick = function () {
       exactCheckbox.value = true;
       listOfAllEffects();
       updateButtonState();
       clearEffectTextLine(uniqueEffects.length + " different effect(s) found.\n");
       var effectNames = effectNamesInput.text;
       processEffects(effectNames, "search");
    };

    clearButton.onClick = function () {
       effectNamesInput.text = [];
       clearEffectTextLine(defaultMsg);
       updateButtonState();
       updateCompSelectedLine(compSelectedMessage);
       exactCheckbox.value = false;
       buttonsGroupTwo.enabled = false;
    };


    toggleEffectButton.onClick = function () {
      var effectNames = effectNamesInput.text;
      clearEffectTextLine();
      processEffects(effectNames, "toggled");
      effectMsgArray.push("");
      processEffects(effectNames, "search");
    };

    enableSelectedButton.onClick = function () {
      var effectNames = effectNamesInput.text;
      clearEffectTextLine();
      processEffects(effectNames, "enabled");
      effectMsgArray.push("");
      processEffects(effectNames, "search");
    };

    disableSelectedButton.onClick = function () {
      var effectNames = effectNamesInput.text;
      clearEffectTextLine();
      processEffects(effectNames, "disabled");
      effectMsgArray.push("");
      processEffects(effectNames, "search");
    };



    // Tab 2 - Tools

    var tab2 = tab.add("tab", undefined, "Tools");

    var containerTwoGroup = tab2.add("group");
    containerTwoGroup.orientation = "column";

    // Margin trick. Empty Text.
    containerTwoGroup.add("statictext", [32, 0, 296, 2], " ");

    var buttonGroup = containerTwoGroup.add("group");
    buttonGroup.orientation = "row";

    var searchButton = buttonGroup.add("button", undefined, "List Layers & Effects");
    searchButton.onClick = function () {
      var effectsList = listEffectsInComps();
      resultTextBox.text = effectsList;
      win.layout.layout(true);
    };

    var searchAllCompsCheckbox2 = containerTwoGroup.add("checkbox", undefined, "Select All Compositions");

    var resultTextBox = containerTwoGroup.add("edittext", undefined, "", { multiline: true, scrolling: true });
    resultTextBox.alignment = ["fill", "center"];
    resultTextBox.size = [296, 320];

    // Informations
    tab2.add("statictext", [32, 0, 296, 12], " ");

    var scriptName = "Effects Switcher";
    var currentVersion = "0.7.5";
    var url = "https://github.com/qtaped/ae-effects-switcher";
    var infosButton = tab2.add("button", undefined, scriptName + " " + currentVersion);
    infosButton.alignment = "right";

    infosButton.onClick = function() {

    // Display informations
    resultTextBox.text = scriptName + " " + currentVersion + "\n";
    resultTextBox.text += url + "\n";

    win.layout.layout(true);

    };


    /* Functions (tab 2) */


    function listEffectsInComps() {

      var compsToSearch = selectCompsToSearch();

        if (compsToSearch.length === 0) {
          error = "Please select one or more compositions or check 'Select All Compositions'.";
          return error;
        }

      var result = "";

      for (var i = 0; i < compsToSearch.length; i++) {
        var comp = compsToSearch[i];
        result += "## Comp: [ " + comp.name + " ]\n";

        for (var j = 1; j <= comp.layers.length; j++) {
          var layer = comp.layers[j];
          var layerName = "→ Layer: < " + layer.name + " >";
          if (!layer.enabled) {
            layerName += " (Disabled)";
          }
          result += layerName + "\n";

          if (layer instanceof AVLayer || layer instanceof TextLayer || layer instanceof ShapeLayer) {
            for (var k = 1; k <= layer.property("ADBE Effect Parade").numProperties; k++) {
              var effect = layer.property("ADBE Effect Parade").property(k);
              var effectName = "      Effect: " + effect.name;
              if (!effect.enabled) {
                effectName += " (Disabled)";
              }
              result += effectName + "\n";
            }
          }
        }

        result += "\n";
      }

      return result;
    }

/* end functions tab 2 */

// Event listeners
searchAllCompsCheckbox1.onClick = function () {
    searchAllCompsCheckbox2.value = searchAllCompsCheckbox1.value;
};

searchAllCompsCheckbox2.onClick = function () {
    searchAllCompsCheckbox1.value = searchAllCompsCheckbox2.value;
};


function updateButtonState() {
    searchEffectsButton.enabled = effectNamesInput.text.length > 0;
};

effectNamesInput.onChanging = function() {
    updateButtonState();
};

/* UI End */
    if (win != null && win instanceof Window) {
      win.center();
      win.show();
    }
    win.layout.layout(true);
  }

  // Show the Panel
  buildUI(thisObj);
})(this);


