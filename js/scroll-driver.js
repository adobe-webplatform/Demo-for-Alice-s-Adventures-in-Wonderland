(function(){
  var $scene1 = $('#scene1')
  var $scene2_1 = $('#scene2_1')
  var $overlay = $('#overlay')
  var $timeline = $('#timeline')
  
  // controller for scene1
  var ctrl = $.superscrollorama({
	  triggerAtCenter: false
	});
	
	function addKeyframe(className, css){
    var _defaults = {
          top: 0,
          height: '20px'
        }
	  
	  return $('<div>')
	    .css($.extend({}, _defaults, css))
	    .attr('class', className) 
	    .appendTo($timeline)
	}     

  function setupScene1(){
    var $content = $('#scene1 p')
    var topOffset = $content.offset().top / 4
    var maxMargin = $scene1.height() - $content.offset().top - $content.height()  
    var k = addKeyframe('key1', {
      top: topOffset,
      height: $scene1.height() - window.innerHeight - topOffset
    })
    
    var options = {
      css: { 
        marginTop: maxMargin 
      }, 
      onComplete: function(){
        console.log('complete')
      }, 
      onReverseComplete: function(){
        console.log('reverse reverse!!!')
      }
    }
    
    ctrl.addTween(k, TweenMax.to( $content, 1, options), k.height());
  }
  
  function setup(){
    setupScene1()
  }
  
  $(setup)
})()
