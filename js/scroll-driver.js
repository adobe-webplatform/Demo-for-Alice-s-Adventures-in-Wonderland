(function(){
  var $scene1 = $('#scene1')
  var $scene2 = $('#scene2')
  var $scene3_1 = $('#scene3_1')
  var $scene3_3 = $('#scene3_2')
  var $overlay = $('#overlay')
  var $timeline = $('#timeline')
  
  // controller timeline element driven animations
  // when top-left corner of the keyframe element reaches top-left corner of viewport
  var ctrlTimeline = new $.superscrollorama({
	  triggerAtCenter: false
	});
	
	// controller for element position driven animation 
  // when top-left corner of the target element reaches mid-point of viewport
  var ctrlPosition = new $.superscrollorama({
    triggerAtCenter: true
  });

  // keyframe index, auto-increment
  var _index = 0
	
	/*
	  Add a keyframe element to the timeline. It will be used as an element proxy for the scroll driver to trigger animations. 
	  
	  All keyframes are absolutely positioned elements on a long, vertical timeline element.
	  Vertical timeline approach used because there are vertical scroll and horizontal offsets to look at when triggering animations.
	  
	  @param {Object} options Hash with CSS properties to add.                              
	  @example:
    {
	    top: '100px',  // will trigger the animation when window.scrollY reaches 100px
	    height: '200px' // will run the animation over a scroll of 200px after the trigger, scrollY from 100px to 300px
	  }
	  
	  @return {Object} jQuery object reference to keyframe element.
	*/
	function addKeyframe(options){
	  var className = 'key' + (++_index)
    var _defaults = {
          top: 0,
          height: '20px'
        }
    
	  return $('<div>')
	    .css($.extend({}, _defaults, options))
	    .attr('class', className) 
	    .appendTo($timeline)
	}     

  // --------------------- SCENE 1 

  function setupScene1(){
    var $el = $('#scene1 p')
    var topOffset = $el.offset().top / 4
    var maxMargin = $scene1.height() - $el.offset().top - $el.height()  
    var keyframe = addKeyframe({
      top: topOffset,
      height: $scene1.height() - window.innerHeight - topOffset
    })
    
    ctrlTimeline.addTween(keyframe, TweenMax.to( $el, 1, {css: { marginTop: maxMargin }}), keyframe.height());
  }
  
  // --------------------- SCENE 2
  
  function setupAliceFalling1(){
    var $el = $('#scene2 .falling1')
    var tl = new TimelineLite()

    tl.add(TweenMax.from($el, 0.25, {css: { autoAlpha: 0, transform:"translateY(-50px) rotate(-45deg) scale(0.85)" }}))
    tl.add(TweenMax.to($el, 0.25, {css: { autoAlpha: 0, transform:"translateY(90px) rotate(-45deg) scale(0.85)" }}))

    ctrlPosition.addTween($el, tl, $el.height() * 2)
  }

  function setupAliceFalling2(){
    var $el = $('#scene2 .falling2')
    var tl = new TimelineLite()
    
    tl.add(TweenMax.from($el, 0.25, {css: { autoAlpha: 0, transform:"translateY(-50px) rotate(-65deg) scale(0.85)" }}))
    tl.add(TweenMax.to($el, 0.25, {css: { autoAlpha: 0, transform:"translateY(90px) rotate(-35deg) scale(0.85)" }}))

    ctrlPosition.addTween($el, tl, $el.height())
  }

  function setupAliceFalling3(){
    var $el = $('#scene2 .falling3')
    var tl = new TimelineLite()

    tl.add(TweenMax.from($el, 0.25, {css: { autoAlpha: 0, transform:"translateY(-70px) rotate(-25deg) scale(0.85)" }}))
    tl.add(TweenMax.to($el, 0.25, {css: { autoAlpha: 0, transform:"translateY(70px) rotate(-25deg) scale(0.85)" }}))

    ctrlPosition.addTween($el, tl, $el.height())
  }

  function setupAliceSeated(){
    var $el = $('#scene2 .act1 .alice-shape')
    ctrlPosition.addTween($el, TweenMax.from( $el, 0.25, {css: { autoAlpha: 0 }}), $el.height())
  }

  function setupCaterpillarDay(){
    var $el = $('#scene2 .act2')
    var $deco = $('#scene2 .decoration')
    
    var offset = $el.offset().top + $deco.offset().left
    
    // horizontal offset applied to scene to scroll caterpillar into viewport
    var hOffset = window.innerWidth - ($el.offset().left + $el.width())
    hOffset = Math.max(Math.abs(hOffset), $deco.offset().left)
    
    // var container = $el.offset().top / 4
    var keyframe = addKeyframe({
      top: $el.offset().top + hOffset
    })
    
    ctrlTimeline.addTween(keyframe, TweenMax.to( $el, 0, {className:"+=day"}));
  }
  
  function crossfade2to3(){
    var $el = $('#overlay')
    var tl = new TimelineLite()

    tl.add(TweenMax.to($el, 1, 
      { 
        css: { 
          autoAlpha: 1
        },
        ease: Linear.easeNone, 
        immediateRender: false, 
        onComplete: function(){
          // todo: unpin scene 2
        }
      }))

    tl.add(TweenMax.to($el, 1, 
      { 
        css: { 
          autoAlpha: 0
        },
        ease: Linear.easeNone, 
        immediateRender: false, 
        onComplete: function(){
          console.log("DESTIANTION REACHED")
        },
        onReverseComplete: function(){
          // todo pin scene2
        }
      }))

    var keyframe = addKeyframe({
      top: $scene2.offset().top + $scene2.height() + 150,
      height: 300,
      background: 'lime'
    })
    
    ctrlTimeline.addTween(keyframe, tl, keyframe.height())
  }
  
  function setup(){
    // scene 1
    setupScene1()
    
    // scene 2
    setupAliceFalling1()
    setupAliceFalling2()
    setupAliceFalling3()
    setupAliceSeated()
    setupCaterpillarDay()
    crossfade2to3()
    
    // scene 3_1
    
    
    // scene 3_2
  }            
  
  $(setup)
})()
