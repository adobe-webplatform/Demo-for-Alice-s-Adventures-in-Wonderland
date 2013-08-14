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

  enterPrev: function(){
    console.log("prev requested")
    var _index = this.index
    this.index = Math.max(this.index - 1, 0)
    
    if (_index === this.index)
      return
    
    this.getAction(this.index).enter()
  },

  enterNext: function(){
    var _index = this.index
    this.index = Math.min(this.index + 1, this.actions.length - 1)
    
    if (_index === this.index)
      return
      
    this.getAction(this.index).enter()
  }
}

var Action = function Action(options){
  var noop = function(){}
  
  // will be set automatically when Action is added by Timeline.addAction()
  this.timeline = null
  this.config = _.extend({
    onEnter: noop,
    onProgress: noop,
    onExit: noop,
    delay: 150
  }, options)
  
  this.throttledProgress = _.throttle(this.progress.bind(this), this.config.delay)
} 

Action.prototype = {
  enter: function(){
    window.addEventListener('scroll', this.throttledProgress)
    this.config.onEnter.call(this)
  },
  
  exit: function(){
    window.removeEventListener('scroll', this.throttledProgress)
    console.log(this.timeline.goingReverse)
    this.timeline.goingReverse
      ? this.timeline.enterPrev()
      : this.timeline.enterNext()
      
    this.config.onExit.call(this)
  },
  
  progress: function(e){
    this.config.onProgress.call(this, e)
  }
}

act1 = new Action({
  onEnter: function(){
    console.log("Enter")
  },
  
  onProgress: function(e){
    if (window.scrollY > 150){
      this.exit()
    }
    console.log("Progress")
  },
  
  onExit: function(e){
    console.log("Exit")
  }
}) 

act2 = new Action({
  onEnter: function(){
    console.log("Action2 Enter")
  },
  
  onProgress: function(e){
    if (window.scrollY < 150){
      this.exit()
    }
    console.log("Action2 Progress")
  },
  
  onExit: function(e){
    console.log("Action2 Exit")
  }
})

time1 = new Timeline
time1.addAction(act1)
time1.addAction(act2)
time1.enterNext()