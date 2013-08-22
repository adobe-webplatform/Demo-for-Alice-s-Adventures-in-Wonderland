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
    
    // TODO: merge this logic with scene pin logic
   // ---------------- SNIP
    $caterpillar = $('#scene2 .act2')
    $decoration = $('#scene2 .decoration')
    $scene2 = $('#scene2')
    
    var hOffset = window.innerWidth - ($caterpillar.offset().left + $caterpillar.width())
    hOffset = Math.max(Math.abs(hOffset), $decoration.offset().left)
    
    var maxScroll = hOffset + $caterpillar.offset().top
    
    // available space under the caterpillar act
    var extent = Math.abs($scene2.height() - $caterpillar.height() - $caterpillar.offset().top)
   // ---------------- SNIP 
    
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

        },
        onReverseComplete: function(){
          // todo pin scene2
        }
      }))
    
    var keyframe = addKeyframe({
      top: maxScroll + (extent * 2) - 150,
      height: 300,
      background: 'lime'
    })
    
    ctrlTimeline.addTween(keyframe, tl, keyframe.height())
  }
  
  // --------------------- SCENE 3
  
  function setupCatFalling2(){
    var $el = $('#scene3_1 .cat-shape2')
    var $content = $('#scene3_1 .cat-shape2 + p')
    var offset = 200
    
    var keyframeEnter = addKeyframe({
      top: $content.offset().top - offset,
      height: $el.height(),
      background: 'aliceblue'
    })
    
    ctrlTimeline.addTween(keyframeEnter, TweenMax.from($el, 0.25, {css: { autoAlpha: 0, transform:"translateY(-40px)" }}), keyframeEnter.height())
    ctrlTimeline.addTween(keyframeEnter, TweenMax.from($content, 0.25, {css: { autoAlpha: 0 }}), keyframeEnter.height())
    
    var keyframeExit = addKeyframe({
      top: $content.offset().top,
      height: 100,
      background: 'blue'
    })
    
    var tlExit = new TimelineLite()
    tlExit.add(TweenMax.to($el, 0.25, {css: { autoAlpha: 0 }}))
    tlExit.add(TweenMax.to($content, 0.25, {css: { autoAlpha: 0 }}))
    
    ctrlTimeline.addTween(keyframeExit, tlExit, keyframeExit.height())
  }
  
  function setupCatFalling3(){
    var $el = $('#scene3_1 .cat-shape3')
    var $content = $('#scene3_1 .cat-shape3 + p')
    var offset = 300
    
    var keyframeEnter = addKeyframe({
      top: $content.offset().top - offset,
      height: $el.height(),
      background: 'aliceblue'
    })
    
    ctrlTimeline.addTween(keyframeEnter, TweenMax.from($el, 0.25, {css: { autoAlpha: 0, transform:"translateY(-25px)" }}), keyframeEnter.height())
    ctrlTimeline.addTween(keyframeEnter, TweenMax.from($content, 0.25, {css: { autoAlpha: 0 }}), keyframeEnter.height())
    
    var keyframeExit = addKeyframe({
      top: $content.offset().top - 100,
      height: 100,
      background: 'blue'
    })
    
    ctrlTimeline.addTween(keyframeExit, TweenMax.to($el, 0.25, {css: { autoAlpha: 0 }}), keyframeExit.height())
    ctrlTimeline.addTween(keyframeExit, TweenMax.to($content, 0.25, {css: { autoAlpha: 0 }}), keyframeExit.height())
  }

  function setupCatFalling4(){
    var $el = $('#scene3_1 .cat-shape4')
    var $content = $('#scene3_1 .cat-shape4 + p')
    var offset = 300
    
    var keyframeEnter = addKeyframe({
      top: $content.offset().top - offset,
      height: $el.height(),
      background: 'aliceblue'
    })
    
    ctrlTimeline.addTween(keyframeEnter, TweenMax.from($el, 0.25, {css: { autoAlpha: 0, transform:"translateY(-25px)" }}), keyframeEnter.height())
    ctrlTimeline.addTween(keyframeEnter, TweenMax.from($content, 0.25, {css: { autoAlpha: 0 }}), keyframeEnter.height())
    
    var keyframeExit = addKeyframe({
      top: $content.offset().top,
      height: 200,
      background: 'blue'
    })
    
    ctrlTimeline.addTween(keyframeExit, TweenMax.to($el, 0.25, {css: { autoAlpha: 0 }}), keyframeExit.height())
    ctrlTimeline.addTween(keyframeExit, TweenMax.to($content, 0.25, {css: { autoAlpha: 0 }}), keyframeExit.height())
  }

  function setupCatFalling5(){
    var $el = $('#scene3_2 .cat-shape5')
    var $content = $('#scene3_2 .cat-shape5 + p')
    var offset = 300
    
    var keyframeEnter = addKeyframe({
      top: $content.offset().top - offset,
      height: $el.height(),
      background: 'aliceblue'
    })
    
    ctrlTimeline.addTween(keyframeEnter, TweenMax.from($el, 0.25, {css: { autoAlpha: 0, transform:"translateY(-35px)" }}), keyframeEnter.height())
    ctrlTimeline.addTween(keyframeEnter, TweenMax.from($content, 0.25, {css: { autoAlpha: 0 }}), keyframeEnter.height())
    
    var keyframeExit = addKeyframe({
      top: $content.offset().top + offset,
      height: 100,
      background: 'blue'
    })
    
    ctrlTimeline.addTween(keyframeExit, TweenMax.to($el, 0.25, {css: { autoAlpha: 0 }}), keyframeExit.height())
    ctrlTimeline.addTween(keyframeExit, TweenMax.to($content, 0.25, {css: { autoAlpha: 0 }}), keyframeExit.height())
  }

  function setupCatWalking(){
    var $el = $('#scene3_2 .act2 .cat-shape-walking')
    var $content = $('#scene3_2 .act2 .content-wrapper p')
    var offset = 100
    
    var keyframeEnter = addKeyframe({
      top: $el.offset().top - offset,
      height: 150,
      background: 'purple'
    })

    ctrlTimeline.addTween(keyframeEnter, TweenMax.from($el, 0.25, {css: { autoAlpha: 0, transform:"translateX(-15px)" }}), keyframeEnter.height())
    ctrlTimeline.addTween(keyframeEnter, TweenMax.from($content, 0.25, {css: { autoAlpha: 0 }, transform:"translateX(-100px)"}), keyframeEnter.height())

    var keyframeExit = addKeyframe({
      top: $el.offset().top + 100,
      height: 100,
      background: 'blue'
    })
    
    ctrlTimeline.addTween(keyframeExit, TweenMax.to($el, 0.25, {css: { autoAlpha: 0 }}), keyframeExit.height())
    ctrlTimeline.addTween(keyframeExit, TweenMax.to($content, 0.25, {css: { autoAlpha: 0 }}), keyframeExit.height())
  }
  
  function setupAliceWalking1(){
    var $el = $('#scene3_2 .act3 .alice-shape')
    var $content = $('#scene3_2 .act3 .cat-paws-shape')
    
    var keyframeEnter = addKeyframe({
      top: $el.offset().top + $el.offset().left - window.innerWidth,
      height: $el.height(),
      background: 'black'
    })
    
    var tlEnter = new TimelineLite()
    tlEnter.add(TweenMax.from($el, 0.25, {css: { autoAlpha: 0 }}))
    tlEnter.add(TweenMax.from($content, 0.25, {css: { autoAlpha: 0 }, transform:"translateX(50px)"}))
    
    ctrlTimeline.addTween(keyframeEnter, tlEnter, keyframeEnter.height())

    var keyframeExit = addKeyframe({
      top: $el.offset().top + $el.offset().left - window.innerWidth/2,
      height: 100,
      background: 'blue'
    })
    
    ctrlTimeline.addTween(keyframeExit, TweenMax.to($el, 0.25, {css: { autoAlpha: 0 }}), keyframeExit.height())
    ctrlTimeline.addTween(keyframeExit, TweenMax.to($content, 0.25, {css: { autoAlpha: 0 }}), keyframeExit.height())
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
    setupCatFalling2()
    setupCatFalling3()
    setupCatFalling4()
    setupCatFalling5()
    
    // scene 3_2
    setupCatWalking()
    setupAliceWalking1()
    
  }            
  
  $(setup)
})()
