(function(){
  var $scene1 = $('#scene1')
  var $scene2_1 = $('#scene2_1')
  var $overlay = $('#overlay')
  var $timeline = $('#timeline')
  
  // --------------------- SCENE 1 
  
  // controller for scene1
  var ctrl1 = new $.superscrollorama({
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
    
    ctrl1.addTween(k, TweenMax.to( $content, 1, options), k.height());
  }
  
  // --------------------- SCENE 2
  
//  controller for element triggers, mid-screen
  var ctrl2 = new $.superscrollorama({
    triggerAtCenter: true
  });
	
	
  function setupAliceFalling1(){
    var $el = $('#scene2 .falling1')
    
     var tl = new TimelineLite()
     tl.add(TweenMax.from($el, 0.25, {css: { autoAlpha: 0, transform:"translateY(-50px) rotate(-45deg) scale(0.85)" }}))
     tl.add(TweenMax.to($el, 0.25, {css: { autoAlpha: 0, transform:"translateY(90px) rotate(-45deg) scale(0.85)" }}))
  
     ctrl2.addTween($el, tl, $el.height() * 2)
  }

  function setupAliceFalling2(){
    var $el = $('#scene2 .falling2')
    
     var tl = new TimelineLite()
     tl.add(TweenMax.from($el, 0.25, {css: { autoAlpha: 0, transform:"translateY(-50px) rotate(-65deg) scale(0.85)" }}))
     tl.add(TweenMax.to($el, 0.25, {css: { autoAlpha: 0, transform:"translateY(90px) rotate(-35deg) scale(0.85)" }}))
  
     ctrl2.addTween($el, tl, $el.height())
  }

  function setupAliceFalling3(){
    var $el = $('#scene2 .falling3')
    
     var tl = new TimelineLite()
     tl.add(TweenMax.from($el, 0.25, {css: { autoAlpha: 0, transform:"translateY(-70px) rotate(-25deg) scale(0.85)" }}))
     tl.add(TweenMax.to($el, 0.25, {css: { autoAlpha: 0, transform:"translateY(70px) rotate(-25deg) scale(0.85)" }}))
  
     ctrl2.addTween($el, tl, $el.height())
  }

  function setupAliceSeated(){
    var $el = $('#scene2 .act1 .alice-shape')
  
    ctrl2.addTween($el, TweenMax.from($el, 0.25, {css: { autoAlpha: 0 }}), $el.height())
  }
	
  
  
  function setup(){
    setupScene1()
    setupAliceFalling1()
    setupAliceFalling2()
    setupAliceFalling3()
    setupAliceSeated()
  }
  
  $(setup)
})()
