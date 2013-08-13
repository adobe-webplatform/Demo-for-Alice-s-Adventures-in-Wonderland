function Timeline(){
  this.actions = []
}

Timeline.prototype.addAction = function(config){
  this.actions.push(config)
}

Timeline.prototype.nextAction = function(){
  return this.actions[Math.min(this.currentIndex + 1, this.actions.length)]
}

Timeline.prototype.prevAction = function(){
  return this.actions[Math.max(this.currentIndex - 1, 0)]
}

// TODO: setup ev listeners
Timeline.prototype.init = function(){

}

// TODO: remove event listeners, etc
Timeline.prototype.teardown = function(){
  
}

function isInViewport(el, xOffset, yOffset){
  var v = {
    yMin: window.scrollY,
    yMax: window.scrollY + window.innerHeight,
    xMin: window.scrollX,
    xMax: window.scrollX + window.innerWidth
  }
  
  var box = el.getBoundingClientRect()
  console.log(box.top)
  return (v.xMin < box.left < v.xMax) && (v.yMin < box.top + window.scrollY < v.yMax)
}


// act 1
function Action(config){
  this.timeline = config.timeline
  config.init ? config.init.call(this) : null
  
  return {
    enterCondition: function(){
      
    },
    
    onEnter: function(){
      console.log("injected", this.oprea)
      window.addEventListener('scroll', this.onProgress)
    },
    
    onExit: function(){
      window.removeEventListener('scroll', this.onProgress)
    },
    
    onProgress: function(e){
      config.onProgress.call(this, e)
    }
  }

} 

var scene1 = new Timeline()

var act1 = new Action({
  timeline: scene1,
  init: function(){
    this.oprea = "vasile!"
  },
  onProgress: function(e){ 
    var p = document.querySelector('#scene1 p:first-child')
    var maxHeight = document.querySelector('#scene1').offsetHeight
    var offsetMultiplier = 1.5  // TODO make multiplier factor of scroll distance from container height. Short screens need multiplier < 1.
    
    var newMargin = window.scrollY * offsetMultiplier;
    var oldMargin = parseInt(p.style.marginTop, 10) | 0
    var usedHeight = p.offsetHeight + p.offsetTop + (newMargin - oldMargin)

    var min = 0
    var max = min + window.innerHeight
    var current = window.innerHeight + window.scrollY
    var viewport = {
      start: window.scrollY,
      end: window.innerHeight + window.scrollY
    }
  
    if (usedHeight < maxHeight) {
      p.style.marginTop = newMargin + "px"
    }
    else{
      // document.body.classList.add('scene1-end')
    }
  }
}) 

scene1.addAction(act1)

act1.onEnter()
