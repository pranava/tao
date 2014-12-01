function Event(name, parent, id, count, timestamp, priority, func, params, trace) {
  this.parent = parent;
  this.name = name;
  this._id = id;
  this.count = count;
  this.timestamp = timestamp;
  this.priority = priority;
  this.func = func;
  this.params = params;
  this.trace = trace;
}

function lifoRank(e1, e2) {
  if (e1.count == e2.count) return 0;

  // Defaults to LIFO
  var result = (e1.count > e2.count) ? -1 : 1;
  if (e1.timestamp == e2.timestamp) {
    if (e1.priority != e2.priority) {
      result = (e1.priority < e2.priority) ? -1 : 1;
    }
  } else {
    result = (e1.timestamp < e2.timestamp) ? -1 : 1;
  }

  return result;
}


function Scheduler(eventRanker) {
  var self = this;
  var _clock = 0;
  var _count = 0;
  var _terminate = false;

  var _uniqueID = {};

  var _pendingEvents = new Heap(eventRanker);

  self.getClock = function() {
    return _clock;
  }

  self.getCount = function() {
    return _count;
  }

  self.terminate = function() {
    _terminate = true;
  }

  self.schedule = function(name, parent, offset, priority, func, params, trace) {
    
    if (!_uniqueID.hasOwnProperty(name)) {
      _uniqueID[name] = 0;
    } else {
      _uniqueID[name] += 1;
    }

    var futureEvent = new Event(name, parent, _uniqueID[name], _count, _clock + offset, priority, func, params, trace);
    _pendingEvents.push(futureEvent);
    _count += 1;
  }

  self.hasNext = function() {
    if (!_terminate) {
      return !_pendingEvents.empty();
    } else {
      return false;
    }
  }

  self.next = function() {
    var currentEvent = _pendingEvents.pop();
    _clock = currentEvent.timestamp;

    return currentEvent;
  }
}

function Engine(eventRanker) {
  var self = this;
  self.eventRanker = eventRanker;
  self.cont = true;

  self.terminate = function() {
    self.cont = false;
  }

  self.execute = function(scenario, duration) {
    var scheduler = new Scheduler(self.eventRanker);

    //changed from ._init
    scenario.Run(scheduler);


    while (scheduler.hasNext()) {
      var currentEvent = scheduler.next();

      if (currentEvent.timestamp > duration) break;
      data = currentEvent.func(scheduler, currentEvent.params);

      if (currentEvent.parent.name == "Run") {
        console.log(currentEvent.name + ' ' + currentEvent._id + ' by Run 0');
      } else if (currentEvent.parent && currentEvent.trace) {
        console.log(currentEvent.name + ' ' + currentEvent._id + ' by ' + currentEvent.parent.name
         + ' ' + currentEvent.parent._id + ' at time '
        + scheduler.getClock());
      }
    }
  }
}