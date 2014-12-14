function Event(name, parentEvent, id, count, timestamp, priority, func, params, trace) {
  this.parentEvent = parentEvent;
  this.name = name;
  this._id = id;
  this.count = count;
  this.timestamp = timestamp;
  this.priority = priority;
  this.func = func;
  this.params = params;
  this.trace = trace;
}

function pendingEvent(name, parentEvent, id, count, timestamp, priority, func, params, trace, condition, condFunc) {
  this.name = name;
  this.parentEvent = parentEvent;
  this._id = id;
  this.count = count;
  this.timestamp = timestamp;
  this.priority = priority;
  this.func = func;
  this.params = params;
  this.trace = trace;
  this.condition = condition;
  this.condFunc = condFunc;
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
  this.clock = 0;
  this.count = 0;
  this.terminate = false;

  this.uniqueID = {};

  this.scheduledEvents = new Heap(eventRanker);
  this.pendingEvents = [];

}

Scheduler.prototype.getClock = function() {
  return this.clock;
}

Scheduler.prototype.getCount = function() {
  return this.count;
}

Scheduler.prototype.terminate = function() {
  this.terminate = true;
}

Scheduler.prototype.schedule = function(name, parentEvent, offset, priority, func, params, trace) {
  if (!this.uniqueID.hasOwnProperty(name)) {
    this.uniqueID[name] = 0;
  } else {
    this.uniqueID[name] += 1;
  }

  var futureEvent = new Event(name, parentEvent, this.uniqueID[name], this.count, this.clock + offset, priority, func, params, trace);
  this.scheduledEvents.push(futureEvent);
  this.count += 1;
}

Scheduler.prototype.schedulePending = function(name, parentEvent, offset, priority, func, params, trace, condition, condFunc) {
  if (!this.uniqueID.hasOwnProperty(name)) {
    this.uniqueID[name] = 0;
  } else {
    this.uniqueID[name] += 1;
  }

  //can't make scenario the prototype because you can't update the scenario whenever a variable changes, so your pending edge checks against the initial
  //condition every time. 
  var futureEvent = new pendingEvent(name, parentEvent, this.uniqueID[name], this.count, this.clock + offset, priority, func, params, trace, condition, condFunc);
  this.pendingEvents.push(futureEvent);
  this.count += 1;
}

Scheduler.prototype.hasNext = function() {
  if (!this.terminate) {
    return !this.scheduledEvents.empty();
  } else {
    return false;
  }
}

Scheduler.prototype.next = function() {
  var currentEvent = this.scheduledEvents.pop();
  this.clock = currentEvent.timestamp;

  return currentEvent;
}


function Engine(eventRanker) {
  this.eventRanker = eventRanker;
}

Engine.prototype.execute = function(scenario, duration) {
  var scheduler = new Scheduler(this.eventRanker);

  scenario.Run(scheduler);

  while (scheduler.hasNext()) {
    var currentEvent = scheduler.next();

    if (currentEvent.timestamp > duration) break;
    data = currentEvent.func(scheduler, currentEvent.params, false);

    if (currentEvent.parentEvent.name == "Run") {
      console.log(currentEvent.name + ' ' + currentEvent._id + ' by Run 0');
    } else if (currentEvent.parentEvent && currentEvent.trace) {
      console.log(currentEvent.name + ' ' + currentEvent._id + ' by ' + currentEvent.parentEvent.name
       + ' ' + currentEvent.parentEvent._id + ' at time '
      + scheduler.getClock());
    }

    //pending events
    for (var e in scheduler.pendingEvents) {
      var event = scheduler.pendingEvents[e];

      // only global variables

      if (event.condFunc(scenario)) {
        data = event.func(scheduler, event.params, true);
        if (event.parentEvent.name == "Run") {
          console.log(event.name + ' ' + event._id + ' by Run 0');
        } else if (event.parentEvent && event.trace) {
          console.log(event.name + ' ' + event._id + ' by ' + event.parentEvent.name
           + ' ' + event.parentEvent._id + ' at time '
          + scheduler.getClock());
        }

        delete scheduler.pendingEvents[e];
      }
    }
  }
}