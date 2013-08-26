
(function(){
  
  /*
    Position fixed an element to the viewport.
    @param {String} position Optional edge of the element to pin against: 'top', 'bottom'. Default 'top'
  */
  $.fn.pin = function(position){
    
    // check given position or use 'top' as default
    position = (['top', 'bottom'].indexOf(position) !== -1) ? position : 'top'
    
    function _pin(el){
      el.css({
        position: 'fixed',
        top: (position === 'top') ? 0 : 'auto',
        bottom: (position === 'bottom') ? 0 : 'auto',
        left: 0,
        zIndex: 1
      })
    }
                 
    return $(this).each(function(){
      _pin($(this))
    })
  }
  
  /*
    Remove position fixed form an element. Reset coordinates and zIndex to auto
  */
  $.fn.unpin = function(){
    function _unpin(el){
      
      if (el.css('position') !== 'fixed')
        return
        
      el.css({
        position: 'relative',
        top: 'auto',
        botton: 'auto',
        left: 'auto',
        zIndex: 'auto'
      })
    }              
    
    return $(this).each(function(){
      _unpin($(this))
    })
  }
  
  var $scene1 = $('#scene1')
  var $scene2 = $('#scene2')
  var $scene3_1 = $('#scene3_1')
  var $scene3_2 = $('#scene3_2')
  var $timeline = $('#timeline')
  
  // controller timeline element driven animations
  // when top-left corner of the keyframe element reaches top-left corner of viewport
  var ctrlTimeline = new $.superscrollorama({
    triggerAtCenter: false,
    playoutAnimations: false
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
	
	/*
	  Cross-fade between two scenes while scrolling:
	    1. pin the source (from) element when its bottom edge reaches the bottom of the viewport
	    2. fade to black overlay 
	    3. unpin the source element and pin the destination element (to) with its top edge stuck to the top of the viewport
	    4. fade from black overlay
	    5. unpin the destination element
	    
    On reverse scroll, play the steps in reverse
	  
	  @param {Object} options Hash with configuration:
	  
    options = {
      from: $('source'), // {Object} Source element
      to: $('destination'), // {Object} Destination element
      distance: 1024, // @optional {Number} Distance in pixels over which to run the cross-fade while scrolling. Default: window.innerHeight
      cssFrom: {}, // @optional {Object} Hash with CSS properties to apply to source (from) after being pinned  
      cssTo: {}, // @optional {Object} Hash with CSS properties to apply to destination (to) after being pinned
      keyframe: null // @optional {Object} Keyframe instance over which to run the cross-fade. Default: starting at bottom of source element
    }
	*/
	function crossfade(options){
	  var $from = $(options.from)
	  var $to = $(options.to)
	  var $overlay = $('#overlay')
	  var duration = options.duration || window.innerHeight
	  
	  // extra CSS properties to apply after pinning $from and $to
	  // used as modifiers of default behavior
	  var cssFrom = $.extend({}, options.cssFrom)
	  var cssTo = $.extend({}, options.cssTo)
	  
	  // use given keyframe, if present, or generate one
    var keyframe = options.keyframe || addKeyframe({
      top: $from.offset().top + $from.height() - window.innerHeight,
      height: duration,
      background: 'rgba(0,0,0,0.5)'
    })
    
    // $('<div>')
    //   .attr('class', 'pin-spacer')
    //   .css({
    //     height: $from.height() + keyframe.height()
    //   })
    //   .insertAfter($from)
    
    var tl = new TimelineLite()
    
    // fade-in
    tl.add(TweenMax.to($overlay, 0.25, 
      { 
        css: { 
          autoAlpha: 1
        },
        ease: Linear.easeNone, 
        immediateRender: false,
        onStart: function(){ 
          $from.pin('bottom').css(cssFrom)
          
          this._lastProgress = this.totalProgress()

          this._onReverseStart = function(){
            console.log('#1 reverse start')
            $from.pin('bottom').css(cssFrom)
          }
          
        },
        onComplete: function(){
          $from.unpin()
        },
        onReverseComplete: function(){
          $from.unpin()
          console.log('#1 reverse complete')
        },
        onUpdate: function(){
          // the end was reached and going reverse
          if (this._lastProgress === 1 && this._lastProgress > this.totalProgress() ){
            this._onReverseStart.call(this)
          }
          
          this._lastProgress = this.totalProgress()
        } 
      }))
      
    // fade-out
    tl.add(TweenMax.to($overlay, 0.25, 
      { 
        css: { 
          autoAlpha: 0
        },
        ease: Linear.easeNone, 
        immediateRender: false, 
        onStart: function(){
          $to.pin('top').css(cssTo)

          this._lastProgress = this.totalProgress()

          this._onReverseStart = function(){
            console.log('#2 reverse start')
            $to.pin('top').css(cssTo)
          }
        },
        onComplete: function(){ 
          $to.unpin()
          window.scrollTo(0, $to.offset().top)
        },
        onReverseComplete: function(){
          $to.unpin()
          console.log('#2 reverse complete')
        },
        onUpdate: function(){
          // the end was reached and going reverse
          if (this._lastProgress === 1 && this._lastProgress > this.totalProgress() ){
            this._onReverseStart.call(this)
          }
          
          this._lastProgress = this.totalProgress()
        }
      }))  
      
    ctrlTimeline.addTween(keyframe, tl, keyframe.height());
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
    
    crossfade({
      from: $scene1,
      to: $scene2,
      duration: window.innerHeight
    })
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

  function setupPin2(){
    
    var $el = $scene2.find('.act2')
    var $deco = $scene2.find('.decoration')
    
    // amount by which to offset the scene horizontally to have the caterpillar act in the viewport
    var hOffset = Math.max(
      Math.abs( window.innerWidth - ($el.offset().left + $el.width()) ),
      $deco.offset().left
    )
    
    var keyframe = addKeyframe({
      top: $el.offset().top,
      height: $el.height() + hOffset + window.innerHeight, // extent
      background: 'rgba(0,150,0,0.6)',
    })
    
    // pin sceen2 while other tweens are playing
    var pin = TweenMax.to($scene2, 0.2, 
      { 
        className: '+=pin',
        ease: Linear.easeNone, 
        immediateRender: false,
        onStart: function(){
          
          console.log('left offset, %s', $scene2.css('left'))
          
          $scene2
            .pin()
            .css({
              top: -1 * $deco.height() + "px",
              left: $scene2.css('left')
            })
          
          this._lastProgress = this.totalProgress()
        },
        onComplete: function(){
          var _memo = $scene2.css('left') 
          console.log(_memo)
          $scene2
            .unpin()
            .css({
              top: 'auto',
              left: _memo
            })
        },
        onReverseComplete: function(){
          $scene2
            .unpin()
            .css({
              top: 'auto',
              left: 'auto'
            })
          console.log('#1 reverse complete')
        },
        onUpdate: function(){
          // the end was reached and going reverse
          if (this._lastProgress === 1 && this._lastProgress > this.totalProgress() ){
            
            console.log('#1 reverse start')
            this.vars.onStart.call(this)
          }
          
          this._lastProgress = this.totalProgress()
        } 
      })
    
    
    var tl = new TimelineLite()
    // horizontal offset
    tl.add(TweenMax.to($scene2, 1, 
      { 
        css: { 
          left: -1 * hOffset + 'px'
        },
        ease: Linear.easeNone, 
        immediateRender: false
      }))
     
     // reveal caterpillar 
     tl.add(TweenMax.to( $el, 1, {className:"+=day"}))

    
     // TODO: add scene2 hOffset at the reverseStart of the TimeLine
    ctrlTimeline.addTween(keyframe, pin, keyframe.height());
    ctrlTimeline.addTween(keyframe, tl, keyframe.height());
    
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

    setupPin2()
    // crossfade2to3()
    
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
