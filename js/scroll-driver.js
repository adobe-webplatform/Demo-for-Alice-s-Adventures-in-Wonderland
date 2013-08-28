
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
  
  /*
    Tween factory with decorated so its members handle the custom 'onReverseStart' event
  */
  var Tween = (function(){

    function _decorate(){
      var noop = function (){}
      var args = Array.prototype.slice.call(arguments, 0)
      var options = args[2]

      if (!options){
        return args
      }  
      
      var _oldOnStart = options.onStart || noop,
          _oldOnUpdate = options.onUpdate || noop

      var decorated = $.extend(options, {
        onStart: function(){
          this._lastProgress = this.totalProgress()
          _oldOnStart.call(this)
        },
        
        onUpdate: function(){
          // the end was reached and going reverse
          if (this._lastProgress === 1 && this._lastProgress > this.totalProgress() && this.vars.onReverseStart){
            this.vars.onReverseStart.call(this)
          }
          
          // memorize current progress for later
          this._lastProgress = this.totalProgress()
          
          _oldOnUpdate.call(this)
        }
      })
      
      args.splice(2, 1, decorated)
      
      return args
    }
        
    function constructor(){}
    
    constructor.prototype.to = function(){
      return TweenMax.to.apply(this, _decorate.apply(this, arguments))
    }  

    constructor.prototype.from = function(){
      return TweenMax.from.apply(this, _decorate.apply(this, arguments))
    }
    
    return new constructor
  })()
  
  
  /*
    Timeline for scroll-driven animations. Wraps superscrollorama.
    
    Animations are described as TimelineLite or TweenMax instances.
    Animations are triggered and run with keyframe elements abs positioned on the timeline element. 

    When a keyframe element's top edge reaches the top of the viewport, 
    its associated animations are triggered. Animations run with scroll increments 
    over the duration of the keyframe element's height in pixels.
    
  */
  var Timeline = (function(){ 
    
    // container for keyframe elements
    var _$timelineEl = $('#timeline')

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
    var _addKeyframe = function(options){
      var className = 'key' + (++_index)
      var _defaults = {
            top: 0,
            height: '20px'
          }

  	  return $('<div>')
  	    .css($.extend({}, _defaults, options))
  	    .attr('class', className) 
  	    .appendTo(_$timelineEl)
    }
    
    var _controller = new $.superscrollorama({
      triggerAtCenter: false,
      playoutAnimations: false
    })
    
    return {
      /*
        Add a keyframe element and run an animation over the scroll distance equal to the keyframe's height.
        The animation is triggered when window.scrollY is equal to the keyframe's top position.
        The animation runs on scroll over a distance equal to the keyframe's height
        
        @param {Object} keyframeCSS Hash of CSS properties to apply to the keyframe.
          
          @example:
          
          keyframeCSS = {
            top: 0, // start the animation when the window.scrollY is at 0 pixels
            height: '100px' // run the animation over a scroll distance of 100 pixels
          }
          
       @param {Object} animation Instance of TweenMax or TimelineLite
       
       @return {Object} the keyframe element
      */
      add: function(keyframeCSS, animation){
        var key = _addKeyframe(keyframeCSS)
                
        _controller.addTween(key, animation, key.height())

        return key
      },
      
      temporaryKeyframe: function(options){
        return _addKeyframe(options)
      }
    }
  })()
  
  var $scene1 = $('#scene1')
  var $scene2 = $('#scene2')
  var $scene3_1 = $('#scene3_1')
  var $scene3_2 = $('#scene3_2')
  
  // controller timeline element driven animations
  // when top-left corner of the keyframe element reaches top-left corner of viewport
  var ctrlTimeline = new $.superscrollorama({
    triggerAtCenter: false,
    playoutAnimations: false
  });

	function addKeyframe(options){
	  return Timeline.temporaryKeyframe(options)
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
      keyframe: null // @optional {Object} Keyframe element CSS properties instance over which to run the cross-fade. Default: starting at bottom of source element
    }
	*/
	function crossfade(options){
	  var $from = $(options.from)
	  var $to = $(options.to)
	  var $overlay = $('#overlay')

	  var defaults = {
	    keyframe: {
	      top: $from.offset().top + $from.height() - window.innerHeight,
        height: window.innerHeight
	    },
	    
	    // TODO extract default handlers and $.extend() if we get anything special
	    handlers: [
	      // fade-in handlers
	      {
	        
	      },
	      
	      // fade-out handlers
	      {
	        
	      }
	    ]
	  }

    var keyframe = $.extend({}, defaults.keyframe, options.keyframe)

    var $spacer = $('<div>')
      .attr('class', 'pin-spacer')
      .css({
        display: 'none',
        height: $from.height() + keyframe.height
      })
      .insertAfter($from)
    
    var animation = new TimelineLite()
    
    // fade-in
    animation.add(Tween.to($overlay, 1, 
      { 
        css: { 
          autoAlpha: 1
        },
        ease: Linear.easeNone, 
        immediateRender: false,
        onStart: function(){
          if (options.onStart){
            options.onStart.call(this)
          }
          else{     
            $from.pin('bottom')
          }

          $spacer.show()
        },
        onReverseStart: function(){
          this.vars.onStart.call(this)
        },
        onComplete: function(){
          if (options.onComplete){
            options.onComplete.call(this)
          }
          else{
            $from.unpin()
          }
          
          $spacer.hide()
        },
        onReverseComplete: function(){
          if (options.onReverseComplete){
            options.onReverseComplete.call(this)
          }
          else{
            $from.unpin()
          }
        }
      }))
      
    // fade-out
    animation.add(Tween.to($overlay, 1, 
      { 
        css: { 
          autoAlpha: 0
        },
        ease: Linear.easeNone, 
        immediateRender: false, 
        onStart: function(){
          $to.pin('top')
          $spacer.show()
        },
        onReverseStart: function(){
          this.vars.onStart.call(this)
        },
        onComplete: function(){ 
          $to.unpin()
          $spacer.hide()
          
          window.scrollTo(0, $to.offset().top)
        },
        onReverseComplete: function(){
          $to.unpin()
        }
      }))
      
    Timeline.add(keyframe, animation)  
	}
	
	
  // --------------------- SCENE 1 

  function setupScene1(){ 
    
    // target element
    var $el = $('#scene1 p')
    
    // max amount by which to offset the margin-top
    var maxMargin = $scene1.height() - $el.offset().top - $el.height()  
    
    // keyframe element CSS properties
    var keyframe = {
      top: $el.offset().top / 4,
      height: $scene1.height() - window.innerHeight - $el.offset().top / 4
    }
    
    // animation description 
    var animation = Tween.to($el, 1, {css: { marginTop: maxMargin }}) 
    
    Timeline.add(keyframe, animation)  
    
    // setup crossfade to next scene when the bottom of $scene1 is reached
    crossfade({
      from: $scene1,
      to: $scene2,
      duration: window.innerHeight
    })
    
  }
  
  // --------------------- SCENE 2
  
  function setupScene2(){
    
    // alice falling 1
    var $act1 = $('#scene2 .falling1')
    var animationAct1 = new TimelineLite()
    var keyframeAct1 = {
      // intentionally begin the animation before the parent scene is unpinned
      top: $act1.offset().top - window.innerHeight / 4,
      height: $act1.height()
    }
    
    animationAct1.add(Tween.from($act1, 0.25, {css: { autoAlpha: 0, transform:"translateY(-70px) rotate(-45deg) scale(0.85)" }}))
    animationAct1.add(Tween.to($act1, 0.25, {css: { autoAlpha: 0, transform:"translateY(70px) rotate(-45deg) scale(0.85)" }}))
    animationAct1.defaultEasing = Linear.easeNone
    
    Timeline.add(keyframeAct1, animationAct1)  
    
    // alice falling 2
    var $act2 = $('#scene2 .falling2')
    var animationAct2 = new TimelineLite()
    var keyframeAct2 = {
      top: $act2.offset().top - window.innerHeight / 2,
      height: $act2.height(),
    }
      
    animationAct2.add(Tween.from($act2, 0.25, {css: { autoAlpha: 0, transform:"translateY(-50px) rotate(-25deg) scale(0.85)" }}))
    animationAct2.add(Tween.to($act2, 0.25, {css: { autoAlpha: 0, transform:"translateY(50px) rotate(-25deg) scale(0.85)" }}))
    animationAct2.defaultEasing = Linear.easeNone
    
    Timeline.add(keyframeAct2, animationAct2)  
    
    // alice seated on mushroom
    var $act3 = $('#scene2 .act1 .alice-shape')
    var animationAct3 = Tween.from($act3, 0.25, {css: { autoAlpha: 0 }})
    var keyframeAct3 = {
      top: $act3.offset().top - window.innerHeight / 2,
      height: $act3.height() * 1.5,
      background: 'red'
    }

    Timeline.add(keyframeAct3, animationAct3)
    
    // content between mushrooms
    var $act4 = $('#scene2 .decoration .content-wrapper')
    var $content = $act4.find('p')
    var maxMargin = $act4.height() - $content.height() - 50
    var animationAct4 = Tween.to($content, 1, {css: { marginTop: maxMargin }})

    var keyframeAct4 = {
      top: $act4.offset().top - window.innerHeight / 2,
      height: $act4.height()
    }
    
    Timeline.add(keyframeAct4, animationAct4)
  }
  
  

  function setupDialogueScene(){
    
    var $el = $scene2.find('.act2')
    var $deco = $scene2.find('.decoration')
    
    // amount by which to offset the scene horizontally to have the caterpillar act in the viewport
    var hOffset = Math.max(
      Math.abs( window.innerWidth - ($el.offset().left + $el.width()) ),
      $deco.offset().left
    )
    
    var keyframe = {
      className: 'key-dialogue',
      top: $el.offset().top,
      height: $el.height() + hOffset + window.innerHeight, // extent
      background: 'rgba(0,150,0,0.6)',
    }
    
    var $spacer = $('<div>')
      .attr('class', 'pin-spacer')
      .css({
        height: keyframe.height
      })
      .insertAfter($scene2)
    
    // pin scene2 while dialogue animation is playing
    var pin = Tween.to($scene2, 0.2, 
      { 
        className: '+=pin',
        ease: Linear.easeNone, 
        immediateRender: false,
        onStart: function(){
          $scene2
            .pin()
            .css({
              top: -1 * $deco.height() + "px",
              left: $scene2.css('left')
            })
        },
        onReverseStart: function(){
          this.vars.onStart.call(this)
        },
        onComplete: function(){
          // unpinning is done in the onComplete of the overlay fade-in (mid-point) to prevent flashes
        },
        onReverseComplete: function(){
          $scene2
            .unpin()
            .css({
              top: 'auto'
            })
        } 
      })
    
    var animation = new TimelineLite()
    // horizontal offset
    animation.add(Tween.to( $scene2, 1, 
      { 
        css: { 
          left: -1 * hOffset + 'px'
        },
        ease: Linear.easeNone, 
        immediateRender: false
      }))
     
    // reveal caterpillar 
    animation.add(Tween.to( $el, 1, {className:"+=day"}))  
    
    // pin and animation added separately because we want them to run at the same time
    Timeline.add(keyframe, pin)
    Timeline.add(keyframe, animation)

    var pinToEnd = function (){
      $scene2.pin()
        .css({
          left: -1 * hOffset + 'px',   
          top: -1 * $deco.height() + "px"     
        })
    }      
    
    // cross-fade between caterpillar scene and cat falling scene
    crossfade({
      from: $scene2,
      to: $scene3_1,
      keyframe: {
        // queue the crossfade keyframe after the dialogue keyframe above
        top: $el.offset().top + keyframe.height,
        height: window.innerHeight,
        background: 'rgba(150,0,0,0.5)',
      },
      onStart: pinToEnd,
      onReverseComplete: pinToEnd,
      onComplete: function(){
        $scene2
          .unpin()
          .css({
            top: 'auto'
          })
      }
    })
  }
  
  function setupCatFallingScene(){
    
    // cat falling 2
    var $act2 = $('#scene3_1 .cat-shape2')
    var keyframes = {
      enter: {
        top: $act2.offset().top - window.innerHeight / 2,
        height: $act2.height() * 2
      },
      
      exit: {
        top: $act2.offset().top,
        height: $act2.height()
      }
    }
    
    Timeline.add(keyframes.enter, Tween.from($act2, 1, {css: { autoAlpha: 0, transform:"translateY(-40px)" }})) 
    Timeline.add(keyframes.enter, Tween.from($act2.next('p'), 1, {css: { autoAlpha: 0 }})) 

    Timeline.add(keyframes.exit, Tween.to($act2, 0.25, {css: { autoAlpha: 0 }})) 
    Timeline.add(keyframes.exit, Tween.to($act2.next('p'), 0.25, {css: { autoAlpha: 0 }})) 
    
    
    // cat falling 3
    var $act3 = $('#scene3_1 .cat-shape3')
    var keyframes = {
      enter: {
        top: $act3.offset().top - window.innerHeight / 2,
        height: $act3.height()
      },
      
      exit: {
        top: $act3.offset().top,
        height: 100
      }
    }
    
    Timeline.add(keyframes.enter, Tween.from($act3, 1, {css: { autoAlpha: 0, transform:"translateY(-25px)" }}))
    Timeline.add(keyframes.enter, Tween.from($act3.next('p'), 1, {css: { autoAlpha: 0 }}))
    
    Timeline.add(keyframes.exit, Tween.to($act3, 1, {css: { autoAlpha: 0 }}))
    Timeline.add(keyframes.exit, Tween.to($act3.next('p'), 0.25, {css: { autoAlpha: 0 }}))
    
    
    // cat falling 4
    var $act4 = $('#scene3_1 .cat-shape4')
    var keyframes = {
      enter: {
        top: $act4.offset().top - window.innerHeight / 2,
        height: $act4.height()
      },

      exit: {
        top: $act4.offset().top,
        height: 200
      }
    }

    Timeline.add(keyframes.enter, Tween.from($act4, 1, {css: { autoAlpha: 0, transform:"translateY(-45px)" }}))
    Timeline.add(keyframes.enter, Tween.from($act4.next('p'), 1, {css: { autoAlpha: 0 }}))

    Timeline.add(keyframes.exit, Tween.to($act4, 1, {css: { autoAlpha: 0 }}))
    Timeline.add(keyframes.exit, Tween.to($act4.next('p'), 0.25, {css: { autoAlpha: 0 }}))
    
    // cat falling 5, horziontal scene
    var $act5 = $('#scene3_2 .cat-shape5')
    var keyframes = {
      enter: {
        top: $act5.offset().top - window.innerHeight / 2,
        height: $act5.height()
      },

      exit: {
        top: $act5.offset().top + window.innerWidth / 2, // this scene is moving horizontally
        height: $act5.width()
      }
    }

    Timeline.add(keyframes.enter, Tween.from($act5, 1, {css: { autoAlpha: 0, transform:"translateY(-35px)" }}))
    Timeline.add(keyframes.enter, Tween.from($act5.next('p'), 1, {css: { autoAlpha: 0 }}))

    Timeline.add(keyframes.exit, Tween.to($act5, 1, {css: { autoAlpha: 0 }}))
    Timeline.add(keyframes.exit, Tween.to($act5.next('p'), 0.25, {css: { autoAlpha: 0 }}))
  }
  

  
  function setupTunnelScene(){
    
    var $el = $scene3_2
    var $act6 = $scene3_2.find('.act6')
    
    // custom pixel distance amount over which to run animation
    var extent = 0
    
    // pixel distance to scroll scene horizontally while pinned
    var hOffset = $el.width() - window.innerWidth

    // pixel distance to scroll scene vertically while pinned
    // used in second part of scene: bridge crossing, cat head reveal
    var vOffset = Math.min($act6.position().top, $el.height() - window.innerHeight)
    
    var keyframe = addKeyframe({
      top: $el.offset().top,
      height: window.innerHeight + $el.width() - window.innerWidth + extent,
      background: 'papaya',
    })
    
    var $spacer = $('<div>')
      .attr('class', 'pin-spacer')
      .css({
        // add an extra viewport height to the spacer so the keyframe can play-out completely; 
        // the keyframe ends when it exits the upper edge of the viewport
        height: keyframe.height() + window.innerHeight
      })
      .insertAfter($el)
    
    var pin = Tween.to($el, 0.2, 
      { 
        className: '+=pin',
        ease: Linear.easeNone, 
        immediateRender: false,
        onStart: function(){
          $scene3_2
            .pin()
            .css({
              top: 0,
              left: $el.css('left')
            })
        },
        onReverseStart: function(){
          this.vars.onStart.call(this)
        },
        onReverseComplete: function(){
          $el
            .unpin()
            .css({
              top: 'auto'
            })
        } 
      })
      
    var tl = new TimelineLite()
    // horizontal offset
    tl.add(Tween.to( $el, 1, 
      { 
        css: { 
          left: -1 * hOffset / 2 + 'px'
        },
        ease: Linear.easeNone, 
        immediateRender: false
      }))    

    // vertical offset
    tl.add(Tween.to( $el, 1, 
      { 
        css: { 
          left: -1 * hOffset + 'px',
          top: -1 * vOffset + 'px'
        },
        ease: Linear.easeNone, 
        immediateRender: false
      }))    

    ctrlTimeline.addTween(keyframe, pin, keyframe.height());
    ctrlTimeline.addTween(keyframe, tl, keyframe.height());
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

    ctrlTimeline.addTween(keyframeEnter, Tween.from($el, 0.25, {css: { autoAlpha: 0, transform:"translateX(-15px)" }}), keyframeEnter.height())
    ctrlTimeline.addTween(keyframeEnter, Tween.from($content, 0.25, {css: { autoAlpha: 0 }, transform:"translateX(-100px)"}), keyframeEnter.height())

    var keyframeExit = addKeyframe({
      top: $el.offset().top + 100,
      height: 100,
      background: 'blue'
    })
    
    ctrlTimeline.addTween(keyframeExit, Tween.to($el, 0.25, {css: { autoAlpha: 0 }}), keyframeExit.height())
    ctrlTimeline.addTween(keyframeExit, Tween.to($content, 0.25, {css: { autoAlpha: 0 }}), keyframeExit.height())
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
    tlEnter.add(Tween.from($el, 0.25, {css: { autoAlpha: 0 }}))
    tlEnter.add(Tween.from($content, 0.25, {css: { autoAlpha: 0 }, transform:"translateX(50px)"}))
    
    ctrlTimeline.addTween(keyframeEnter, tlEnter, keyframeEnter.height())

    var keyframeExit = addKeyframe({
      top: $el.offset().top + $el.offset().left - window.innerWidth/2,
      height: 100,
      background: 'blue'
    })
    
    ctrlTimeline.addTween(keyframeExit, Tween.to($el, 0.25, {css: { autoAlpha: 0 }}), keyframeExit.height())
    ctrlTimeline.addTween(keyframeExit, Tween.to($content, 0.25, {css: { autoAlpha: 0 }}), keyframeExit.height())
  }
  
  

  
  function setup(){
    
    // scene 1
    setupScene1()
    
    // scene 2
    setupScene2()
    setupDialogueScene()
    
    // scene 3_1
    setupCatFallingScene()
    
    // scene 3_2
    setupTunnelScene()
    
    setupCatWalking()
    setupAliceWalking1()
    
  }            
  
  $(setup)
})()
