(function($, window) {

  var SigmaGenerator = window.SigmaGenerator;

  // For events.
  function EventPanel(editorDiv, footerDiv) {
    this.editorDiv = $(editorDiv);
    this.footerDiv = $(footerDiv);
    this.editor = $('#node-editor', this.editorDiv);
    this.variableNameInput = $('.variableNameInput');

    this.eventNameInput = this.queryByTemplateId('eventName');
    this.stateChangeDiv = this.queryByTemplateId('stateChange');
    this.eventTrace = this.queryByTemplateId('traceEvent');
    this.parametersUl = this.queryByTemplateId('parameters');

    this.variableNameInput.on('keyup', this.addParameterCallback(this));

    this.codeEditor = ace.edit(this.stateChangeDiv[0]);
    this.codeEditor.setTheme("ace/theme/tomorrow");
    this.codeEditor.getSession().setMode("ace/mode/javascript");

    this.currentNode = null;
  }

  EventPanel.prototype.queryByTemplateId = function(templateId) {
    return $('[data-templateId="' + templateId + '"]', this.editor);
  }

  EventPanel.prototype.buildActions = function() {
    var container = $('<div></div>').addClass('right');
    var updateAction = $('<a></a>')
      .attr('href', '#')
      .addClass('action-button')
      .addClass('green')
      .text('Update');

    var discardAction = $('<a></a>')
      .attr('href', '#')
      .addClass('action-button')
      .text('Revert');

    updateAction.on('click', this.update(this));
    discardAction.on('click', this.revert(this));

    container
      .append(discardAction)
      .append(updateAction);
    return container;
  }

  EventPanel.prototype.load = function(node) {
    this.clear();
    this.footerDiv.append(this.buildActions());

    this.eventNameInput.val(node.title);

    if (eval(node.trace)) {
      this.eventTrace.prop('checked', true);
    } else {
      this.eventTrace.prop('checked', false);
    }

    this.codeEditor.getSession().setValue(node.stateChange);
    this.currentNode = node;


    for (var key in this.currentNode.parameters) {
      if (this.currentNode.parameters.hasOwnProperty(key)) {
        // this.currentEdge.destination.parameters[key]
        var container = $('<li></li>');
        var nameSpan = $('<span></span>').addClass('code').addClass('variableName').text(key);
        var deleteAnchor = $('<a></a>').addClass('right').attr('href', '#').text('✕');

        container.append(nameSpan).append(deleteAnchor);
        deleteAnchor.on('click', function() {
          container.remove();
        });
        this.parametersUl.append(container);
      }
    }

    this.editor.show();
  }

  EventPanel.prototype.clear = function() {
    this.editor.hide();
    this.footerDiv.empty();

    this.eventNameInput.val('');
    this.variableNameInput.val('');
    this.codeEditor.getSession().setValue('');
    this.parametersUl.empty();

    this.currentNode = null;
  }

  EventPanel.prototype.addParameter = function(name) {
    var container = $('<li></li>');
    var nameSpan = $('<span></span>').addClass('code').addClass('variableName').text(name);
    var deleteAnchor = $('<a></a>').addClass('right').attr('href', '#').text('✕');

    container.append(nameSpan).append(deleteAnchor);
    deleteAnchor.on('click', function() {
      container.remove();
    });


    this.currentNode.parameters[name] = null;

    this.parametersUl.append(container);
  }

  EventPanel.prototype.addParameterCallback = function(panel) {
    return (function(e) {
      if (e.keyCode == 13) {
        var variableName = panel.variableNameInput.val();
        panel.addParameter(variableName);
        panel.variableNameInput.val('');
      }
    });
  }

  EventPanel.prototype.update = function(panel) {
    return (function() {
      var newName = panel.eventNameInput.val();
      var newTrace = panel.eventTrace.is(':checked');
      var newStateChange = panel.codeEditor.getSession().getValue();
      var newParameters = {};

      var paramEl = $('li', panel.parametersUl);
      for (var i = 0; i < paramEl.length; i++) {
        var varNameEl = $('span.variableName', paramEl[i]);
        newParameters[varNameEl.text()] = null;
      }


      panel.currentNode.setTitle(newName);
      panel.currentNode.trace = newTrace.toString();
      panel.currentNode.stateChange = newStateChange;
      panel.currentNode.parameters = newParameters;
    });
  }

  EventPanel.prototype.revert = function(panel) {
    return (function() {
      if (panel.currentNode) {
        panel.load(panel.currentNode);
      }
    });
  }

  // For edges.
  function EdgePanel(editorDiv, footerDiv) {
    this.editorDiv = $(editorDiv);
    this.footerDiv = $(footerDiv);
    this.editor = $('#edge-editor', this.editorDiv);

    this.sourceNameInput = this.queryByTemplateId('sourceName');
    this.targetNameInput = this.queryByTemplateId('targetName');
    this.delay = this.queryByTemplateId('delay');
    this.priority = this.queryByTemplateId('priority');
    this.conditionDiv = this.queryByTemplateId('condition');
    this.parametersUl = this.queryByTemplateId('parameters');
    this.multipleEdgeSelectorUl = this.queryByTemplateId('multipleEdgeSelector');

    this.codeEditor = ace.edit(this.conditionDiv[0]);
    this.codeEditor.setTheme("ace/theme/tomorrow");
    this.codeEditor.getSession().setMode("ace/mode/javascript");

    this.erg = null;
    this.currentEdge = null;
  }

  EdgePanel.prototype.queryByTemplateId = function(templateId) {
    return $('[data-templateId="' + templateId + '"]', this.editor);
  }

  EdgePanel.prototype.buildActions = function() {
    var container = $('<div></div>').addClass('right');
    var updateAction = $('<a></a>')
      .attr('href', '#')
      .addClass('action-button')
      .addClass('green')
      .text('Update');

    var discardAction = $('<a></a>')
      .attr('href', '#')
      .addClass('action-button')
      .text('Revert');

    var deleteAction = $('<a></a>')
      .attr('href', '#')
      .addClass('action-button')
      .text('Delete');

    updateAction.on('click', this.update(this));
    discardAction.on('click', this.revert(this));
    deleteAction.on('click', this.delete(this));

    container
      .append(deleteAction)
      .append(discardAction)
      .append(updateAction);
    return container;
  }
  
  EdgePanel.prototype.delete = function(panel) {
    return (
      function() {
        panel.erg.deleteSelected();
        $('#contents').hide();
      });
  }

  EdgePanel.prototype.loadMultipleEdges = function(edges, erg) {
    this.clear();
    this.footerDiv.append(this.buildActions());
    this.erg = erg;
    // this.currentEdge = edges;
    if (edges.length < 2) {
      $('.multiple-edge-action').hide();
      $('#edgeListDisplay').hide();
      this.load(edges[0]);
    } else {
      $('#edgeListDisplay').show();
      this.load(edges[0]);
      var i = 0;
      for (var edge in edges) {
        i++;
        var container = $('<li></li>').addClass('edgeDropDown');
        var nameSpan = $('<a></a>')
          .attr('href', '#')
          .addClass('action-button')
          .addClass('green')
          .text('Edge ' + i);
        container.append(nameSpan);
        this.multipleEdgeSelectorUl.append(container);
        nameSpan.on('click', this.returnLoad(edges[edge]));
      }
    }
  }

  EdgePanel.prototype.returnLoad = function(edge) {
    var self = this;
    return (function() {
      self.load(edge);
    });
  }

  EdgePanel.prototype.load = function(edge) {
    // this.clear();
    // this.footerDiv.append(this.buildActions());

    this.sourceNameInput.val(edge.origin.title);
    this.targetNameInput.val(edge.destination.title);
    this.delay.val(edge.delay);
    this.priority.val(edge.priority);
    this.codeEditor.getSession().setValue(edge.condition);
    this.currentEdge = edge;
    this.erg.selectedPartical = edge;

    this.parametersUl.empty();


    for (var key in this.currentEdge.destination.parameters) {
      if (this.currentEdge.destination.parameters.hasOwnProperty(key)) {
        var container = $('<li></li>').addClass('edgeParams');
        var nameSpan = $('<span></span>').addClass('code').addClass('variableName').text(key);
        var deleteAnchor = $('<a></a>').addClass('right').attr('href', '#').text('✕');
        var parameterValue = $('<input></input>').attr('placeholder', 'Parameter Value').addClass('parameterVal');
        if (this.currentEdge.parameters[key]) {
          parameterValue.attr('value', this.currentEdge.parameters[key]);
        } else {
          parameterValue.attr('value', '');
        }
        container.append(nameSpan).append(deleteAnchor).append(parameterValue);
        deleteAnchor.on('click', function() {
          container.remove();
        });
        this.parametersUl.append(container);
      }
    }


    this.editor.show();
  }

  EdgePanel.prototype.clear = function() {
    this.editor.hide();
    this.footerDiv.empty();

    this.sourceNameInput.val('');
    this.targetNameInput.val('');
    this.codeEditor.getSession().setValue('');
    this.parametersUl.empty();
    this.multipleEdgeSelectorUl.empty();

    this.currentEdge = null;
  }

  EdgePanel.prototype.update = function(panel) {
    return (function() {
      var newDelay = panel.delay.val();
      var newPriority = panel.priority.val();
      var newCondition = panel.codeEditor.getSession().getValue();
      var newParameters = {};

      var paramEl = $('li', panel.parametersUl);
      for (var i = 0; i < paramEl.length; i++) {
        var varNameEl = $('span.variableName', paramEl[i]);
        var paramNameEl = $('input.parameterVal', paramEl[i]);

        newParameters[varNameEl.text()] = paramNameEl.val();

      }

      panel.currentEdge.delay = newDelay;
      panel.currentEdge.priority = newPriority;
      panel.currentEdge.condition = newCondition;

      panel.currentEdge.parameters = newParameters;
    });
  }

  EdgePanel.prototype.revert = function(panel) {
    return (function() {
      if (panel.currentEdge) {
        panel.load(panel.currentEdge);
      }
    });
  }

  function GlobalPanel(editorDiv, footerDiv) {
    this.editorDiv = $(editorDiv);
    this.footerDiv = $(footerDiv);
    this.editor = $('#variable-editor', this.editorDiv);

    this.variableNameInput = $('.globalVariableNameInput');

    this.timeUnitsInput = this.queryByTemplateId('timeUnits');
    this.globalVariablesUl = this.queryByTemplateId('globalVariables');

    this.variableNameInput.on('keyup', this.addGlobalVariableCallback(this));

    this.erg = null;
  }

  GlobalPanel.prototype.queryByTemplateId = function(templateId) {
    return $('[data-templateId="' + templateId + '"]', this.editor);
  }

  GlobalPanel.prototype.show = function(erg) {
    this.erg = erg;
    this.footerDiv.append(this.buildActions());
    this.editor.show();
  }

  GlobalPanel.prototype.clear = function() {
    this.editor.hide();
  }

  GlobalPanel.prototype.addParameter = function(name) {
    var container = $('<li></li>').addClass('variables');
    var nameSpan = $('<span></span>').addClass('code').addClass('variableName').text(name);
    var deleteAnchor = $('<a></a>').addClass('right').attr('href', '#').text('✕');

    var initialValue = $('<input></input>').attr('placeholder', 'Initial Value').addClass('initialVal');

    container.append(nameSpan).append(deleteAnchor).append(initialValue);
    deleteAnchor.on('click', function() {
      container.remove();
    });

    this.globalVariablesUl.append(container);
  }

  GlobalPanel.prototype.addGlobalVariableCallback = function(panel) {
    return (function(e) {
      if (e.keyCode == 13) {
        var globalVariableName = panel.variableNameInput.val();
        panel.addParameter(globalVariableName);
        panel.variableNameInput.val('');
      }
    });
  }

  GlobalPanel.prototype.buildActions = function() {
    var container = $('<div></div>').addClass('right');

    var downloadSigmaCode = $('<a></a>')
      .attr('href', '#')
      .addClass('action-button')
      .addClass('green')
      .text('Download Sigma File');

    var downloadTaoCode = $('<a></a>')
      .attr('href', '#')
      .addClass('action-button')
      .addClass('green')
      .text('Download Tao File');

    downloadSigmaCode.on('click', this.sigma(this));

    downloadTaoCode.on('click', this.tao(this));

    container.append(downloadSigmaCode);
    container.append(downloadTaoCode);
    return container;
  }


  GlobalPanel.prototype.sigma = function(panel) {
    return (function(e) {
      var sigmaGenerator = new SigmaGenerator(panel.erg.getJSON());
      var blob = new Blob([sigmaGenerator.template()], {
        type: 'text/html'
      });
      var name = panel.erg.getJSON().name + '.mod';
      saveAs(blob, name);
    });
  }

  GlobalPanel.prototype.tao = function(panel) {
    return (function(e) {
      var json = panel.erg.getJSON();
      var blob = new Blob([JSON.stringify(json)], {
        type: 'text/html'
      });
      var name = json.name + '.txt';
      saveAs(blob, name);
    });
  }

  window.EventPanel = EventPanel;
  window.EdgePanel = EdgePanel;
  window.GlobalPanel = GlobalPanel;

}(jQuery, window));