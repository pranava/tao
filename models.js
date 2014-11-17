(function($, window) {

  /* bind is not available in Safari browsers */
  if (typeof Function.prototype.bind === 'undefined') {
    Function.prototype.bind = function(context) {
      var that = this;
      return function() {
        return that.apply(context || null,
                          Array.prototype.slice.call(arguments));
      };
    };
  }

  var RAD2DEG = 180 / Math.PI,
      DEG2RAD = Math.PI / 180;

  /**
   * Base prototype for a diagram element
   * @param {object} opts
   * Possible Options:
   * type: segment or node
   * w: width of the element
   * h: height of the element
   * x: starting x coordinate of the element
   * y: starting y coordinate of the element
   * title: assign a title to the element to display
   * stage: the parent container in which to append the element
   * events: {
   *   click: called when the element is clicked (optional)
   * }
   */
  function Particle(opts) {
    opts = opts || {};
    this.title = opts.title;

    /* Store dimensions and pre-compute center */
    this.dimensions = {
      w: opts.w || 0,
      h: opts.h || 0,
      center: {
        x: (opts.w || 0) / 2,
        y: (opts.h || 0) / 2
      }
    };

    /* X/Y coords of this element */
    this.translate = {
      x: opts.x || 0,
      y: opts.y || 0
    };

    /* Reference to the parent container */
    this.stage = $(opts.stage);

    /* DOM element to represent this Particle
       The type passed in will be assigned as
       a class name of the element. */
    this.el = $('<div class="' + opts.type + '"></div>');
    this.el.css({
      width: this.dimensions.w,
      height: this.dimensions.h
    });

    /* Setup default events and assign events from options */
    this.events = { base: function() {} };
    for (var k in (opts.events || {})) {
      this.events[k] = opts.events[k];
    }
    return this;
  }

  /**
   * Attach the element to the parent container.
   * Calls onAttach before attaching to allow
   * custom functions to be run before attaching.
   */
  Particle.prototype.attach = function() {
    this.onAttach.call(this);
    this.stage.append(this.el);
    this.setPosition();
    return this;
  };

  /**
   * Remove the element from the parent.
   */
  Particle.prototype.remove = function() {
    this.onRemove.call(this);
    this.el.remove();
    return this;
  };

  /**
   * Set the CSS position of the element to the
   * coordinates saved in the translate object.
   */
  Particle.prototype.setPosition = function() {
    this.el.css({
      top: this.translate.y,
      left: this.translate.x
    });
    return this;
  };

  /**
   * Represents a circle node on the diagram.
   * Extends Particle prototype.
   * @param {object} opts
   * Possible Options: Same as Particle.
   */
  function Node(opts) {
    opts.type = 'node';
    
    this.parameters = opts.parameters;
    this.stateChange = opts.stateChange;
    this.jsonX = opts.jsonX;
    this.jsonY = opts.jsonY;

    Particle.prototype.constructor.call(this, opts);
    this.el.on({
      mousedown: this.onDragStart.bind(this),
      mouseup: this.onDragEnd.bind(this),
      click: this.onClick.bind(this)
    });
    /**
     * Set up a list of segments that can be
     * attached to this node.
     */
    this.segments = [];
    
    this.defaultTheme = opts.defaultTheme || Node.themes.blue;
    this.setTheme(this.defaultTheme);
  }

  Node.prototype = new Particle();
  Node.prototype.constructor = Particle;

  /**
   * Append a title element to the node on attach.
   */
  Node.prototype.onAttach = function() {
    this.titleSpan = $('<span></span>');
    this.el.append(this.titleSpan);
    this.setTitle(this.title);
  };

  /**
   * Add a segment to the segments list. Expects
   * a Segment object.
   */
  Node.prototype.addSegment = function(segment) {
    this.segments.push(segment);
  };

  /**
   * Run through all segments in the list and remove
   * the one requested.
   */
  Node.prototype.removeSegment = function(segment) {
    for (var i = 0; i < this.segments.length; i++) {
      if (this.segments[i] === segment) {
        this.segments.splice(i, 1);
        break;
      }
    }
  };

  Node.prototype.getNeighboringEdge = function(node) {
    for (var i = 0; i < this.segments.length; i++) {
      if (this.segments[i].origin === this && 
          this.segments[i].destination === node) {
        return this.segments[i];
      }
    }

    return null;
  }

  /**
   * Call the click event passed in when instantiating
   * a new node. Can be used to trigger other events
   * specific to the diagram.
   */
  Node.prototype.onClick = function(e) {
    (this.events.click || this.events.base).call(this, e);
    return false;
  };

  /**
   * Engage dragging on the Node by binding the Node's
   * onDrag method to the window onmousemove. Save the
   * origin coordinates of the mousedown to account
   * for movement offsets.
   */
  Node.prototype.onDragStart = function(e) {
    $(window).on('mousemove', this.onDrag.bind(this));
    this.el.addClass('dragging');
    this.clickCoords = {
      x: e.offsetX || (e.pageX - this.el.offset().left),
      y: e.offsetY || (e.pageY - this.el.offset().top)
    };
  };

  Node.prototype.onDrag = function(e) {
    this.translate.x = e.pageX - this.clickCoords.x;
    this.translate.y = e.pageY - this.clickCoords.y;
    for (var i = 0; i < this.segments.length; i++) {
      this.segments[i].calculateTransformation();
    }
    this.setPosition();
  };

  Node.prototype.onCreateEdge = function(e) {
    this.translate.x = e.pageX - this.clickCoords.x;
    this.translate.y = e.pageY - this.clickCoords.y;
    for (var i = 0; i < this.segments.length; i++) {
      this.segments[i].calculateTransformation();
    }
    this.setPosition();
  };

  /**
   * Remove dragging events when mouse up.
   */
  Node.prototype.onDragEnd = function(e) {
    this.el.removeClass('dragging');
    $(window).off('mousemove');
  };

  /**
   * Called when .remove is called on a node.
   * Calls remove on all associated segments.
   */
  Node.prototype.onRemove = function() {
    while (this.segments.length) {
      this.segments.shift().remove();
    }
  };

  Node.prototype.setTitle = function(title) {
    this.title = title;
    this.titleSpan.text(this.title);
  }

  Node.prototype.setTheme = function(theme) {
    this.el.css({
      background: theme.fill,
      color: theme.outline,
      border: '2px solid ' + theme.outline
    });
  }

  Node.themes = {
    blue:   { outline: 'rgb(21, 136, 209)',  fill: 'rgb(237, 244, 249)' },
    green:  { outline: 'rgb(22, 150, 136)',  fill: 'rgb(231, 242, 241)' },
    purple: { outline: 'rgb(182, 113, 182)', fill: 'rgb(244, 236, 246)' },
    orange: { outline: 'rgb(252, 109, 33)',  fill: 'rgb(255, 243, 224)' }
  }

  /**
   * Represents a line segment on the diagram.
   * Extends Particle prototype.
   * @param {object} opts
   * Possible Options:
   * w: width of the segment
   * h: height of the segment
   * stage: the parent container in which to append the element
   * origin: origin of the line segment (must be a Node object)
   * destination: destination of the line segment (must be a Node object)
   * events: {
   *   click: called when the element is clicked (optional)
   * }
   */
  function Segment(opts) {
    opts.type = 'segment';
    Particle.prototype.constructor.call(this, opts);

    this.delay = opts.delay;
    this.condition = opts.condition;
    this.priority = opts.priority;
    this.parameters = opts.parameters;

    this.arrowTip = $('<div class="arrow-tip"></div>');
    
    this.el.append(this.arrowTip);
    this.el.on({
      click: this.onClick.bind(this)
    });

    this.origin = opts.origin;
    this.destination = opts.destination;

    this.defaultTheme = opts.defaultTheme || Segment.themes.grey;
    this.setTheme(this.defaultTheme);
  }

  Segment.prototype = new Particle();
  Segment.prototype.constructor = Particle;

  Segment.prototype.onAttach = function() {
    this.calculateTransformation();

    var neighboringEdge = this.destination.getNeighboringEdge(this.origin);
    if (neighboringEdge) {
      neighboringEdge.calculateTransformation();
    }
  };

  Segment.prototype.onRemove = function() {
    this.origin.removeSegment(this);
    this.destination.removeSegment(this);
    this.origin = null;
    this.destination = null;
  };

  Segment.prototype.onClick = function(e) {
    (this.events.click || this.events.base).call(this);
    return false;
  };

  Segment.themes = {
    grey: 'rgb(84, 110, 122)',
    red:  'rgb(255, 110, 122)'
  }

  function LineSegment(opts) {
    Segment.call(this, opts);

    this.arrowTip.css({ float: 'right' });

    this.el.addClass('line');
    this.el.css({ width: this.dimensions.w, height: this.dimensions.h });

    this.origin.addSegment(this);
    this.destination.addSegment(this);
  }

  LineSegment.prototype = Object.create(Segment.prototype);
  LineSegment.prototype.constructor = LineSegment;

  LineSegment.prototype.calculateTransformation = function() {
    this.translate = {
      x: this.origin.translate.x + this.origin.dimensions.center.x,
      y: (this.origin.translate.y + this.origin.dimensions.center.y) -
        this.dimensions.center.y
    };

    this.distance = {
      x: (this.origin.translate.x - this.destination.translate.x) * -1,
      y: (this.origin.translate.y - this.destination.translate.y) * -1
    };

    this.transform = 'rotate(' +
      (Math.atan2(this.distance.y, this.distance.x) * RAD2DEG).toFixed(2) +
      'deg)';

    if (this.destination.getNeighboringEdge(this.origin)) {
      this.transform += ' translate(0, -5px)';
    }

    this.el.css({
      width: this.calculateWidth(),
      transform: this.transform,
      oTransform: this.transform,
      msTransform: this.transform,
      MozTransform: this.transform,
      webkitTransform: this.transform
    });

    this.setPosition();
  };

  LineSegment.prototype.calculateWidth = function() {
    var w = Math.ceil(Math.sqrt(Math.pow(this.distance.x, 2) +
                     Math.pow(this.distance.y, 2))) -
      this.origin.dimensions.center.x - 4;//this.canvas.raw.width;
    return w < 0 ? 0 : w;
  };

  LineSegment.prototype.setTheme = function(color) {
    this.el.css({ 'background': color });
    this.arrowTip.css({ 'border-left-color': color });
  }


  function CircleSegment(opts) {
    Segment.call(this, opts);

    this.arrowTip.css({ margin: '-6px auto 0 auto' });

    this.el.css({ width: 65, height: 65 });
    this.el.addClass('circle');

    this.origin.addSegment(this);
  }

  CircleSegment.prototype = Object.create(Segment.prototype);
  CircleSegment.prototype.constructor = CircleSegment;

  CircleSegment.prototype.calculateTransformation = function() {
    this.translate = {
      x: this.origin.translate.x,
      y: (this.origin.translate.y - this.origin.dimensions.center.y)
    };

    this.setPosition();
  };

  CircleSegment.prototype.setTheme = function(color) {
    this.el.css({ 'border-color': color });
    this.arrowTip.css({ 'border-left-color': color });
  }

  Segment.build = function(opts) {
    var segment = null;
    if (opts.origin == opts.destination) {
      segment = new CircleSegment(opts); 
    } else {
      segment = new LineSegment(opts);
    }

    return segment;
  }

  /* Expose to the world */
  window.Particle = Particle;
  window.Node = Node;
  window.Segment = Segment;

}(jQuery, window));