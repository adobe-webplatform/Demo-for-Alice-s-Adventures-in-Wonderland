extend = function(obj){
  Array.prototype.slice.call(arguments, 1).forEach(function(source){
    if (source) {
      for (var prop in source){
        obj[prop] = source[prop]
      }
    }
  })
  return obj
} 

var Timeline = function Timeline(){
  this.actions = []
  this.goingReverse = false
  this.index = -1
  this.init()
}

Timeline.prototype = {
  init: function(){
    var _scrollY = 0
    var self = this
    window.addEventListener('scroll', function(e){
      self.goingReverse = (_scrollY > window.scrollY)
      _scrollY = window.scrollY
    })
  },
  
  addAction: function(action){
    action.timeline = this
    this.actions.push(action)
  },
  
  getAction: function(index){ 
    return (-1 < index && index < this.actions.length) ? this.actions[index] : null
  },

  playPrev: function(){
    var _index = this.index
    this.index = Math.max(this.index - 1, 0)
    
    // if (_index === this.index)
    //   return
    
    this.getAction(this.index).enter()
  },

  playNext: function(){
    var _index = this.index
    this.index = Math.min(this.index + 1, this.actions.length - 1)
    
    // if (_index === this.index)
    //   return
      
    this.getAction(this.index).enter()
  },
  
  play: function(){
    this.goingReverse ? this.playPrev() : this.playNext()
  }
}

var Action = function Action(options){
  
  // placeholder harmless function for missing callbacks
  var _noop = function(){}
  
  var _obj = function(options){
    
    // will be set automatically when Action is added by Timeline.addAction()
    this.timeline = null
    this.config = _.extend({
      onEnter: _noop,
      onProgress: _noop,
      onExit: _noop,
      delay: 100
    }, options)

    this.throttledProgress = _.throttle(this.progress.bind(this), this.config.delay)
  }
  
  _obj.prototype = {
    enter: function(){
      window.addEventListener('scroll', this.throttledProgress)
      this.config.onEnter.call(this)
    },

    exit: function(){
      window.removeEventListener('scroll', this.throttledProgress)
      this.timeline.goingReverse
        ? this.timeline.playPrev()
        : this.timeline.playNext()

      this.config.onExit.call(this)
    },

    progress: function(e){
      this.config.onProgress.call(this, e)
    }
  }

  // ensure new Action() and Action() return the same proto signature
  return new _obj(options)
}