// time for each event + parent
//event unique id's

// the times need double checking because they sometimes dont print accurate timestamps
// i think the problem is because you wanted to do it through the scheduler, but the order in which events are scheduled doesn't always equate to the 
// order in which they are executed. can we talk about this tomorrow?

function Event(name, parent, id, count, timestamp, priority, func, params) {
  this.parent = parent;
  this.name = name;
  this._id = id;
  this.count = count;
  this.timestamp = timestamp;
  this.priority = priority;
  this.func = func;
  this.params = params;
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

  var _uniqueID = {};

  var _pendingEvents = new Heap(eventRanker);

  self.getClock = function() {
    return _clock;
  }

  self.getCount = function() {
    return _count;
  }

  self.schedule = function(name, parent, offset, priority, func, params) {
    
    if (!_uniqueID.hasOwnProperty(name)) {
      _uniqueID[name] = 0;
    } else {
      _uniqueID[name] += 1;
    }

    var futureEvent = new Event(name, parent, _uniqueID[name], _count, _clock + offset, priority, func, params);
    _pendingEvents.push(futureEvent);
    _count += 1;
  }

  self.hasNext = function() {
    return !_pendingEvents.empty();
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
      } else if (currentEvent.parent) {
        console.log(currentEvent.name + ' ' + currentEvent._id + ' by ' + currentEvent.parent.name
         + ' ' + currentEvent.parent._id + ' at time '
        + scheduler.getClock());
      }
    }
  }
}