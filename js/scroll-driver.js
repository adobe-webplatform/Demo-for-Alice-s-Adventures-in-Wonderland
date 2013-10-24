/**
 *
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
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
    jQuery utility wrapper for Array.some(). Polyfill if missing
  */
  $.some = function(obj, iterator, context) {
    var result = false

    if (obj == null){
      return result
    }

    if (Array.prototype.some && obj.some === Array.prototype.some){
      return obj.some(iterator, context)
    }

    $.each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return {};
    })

    return !!result;
  };


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
          if (this._lastProgress === 1 && this._lastProgress > this.totalProgress() && this.vars.data && this.vars.data.onReverseStart){
            this.vars.data.onReverseStart.call(this)
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
    its associated animations are triggered. Animations run on scroll
    over the duration of the keyframe element's height in pixels.
  */
  var Timeline = (function(){

    // container for keyframe elements
    var _$timelineEl = $('#timeline')

    // keyframe index, auto-increment
    var _index = 0

    var _emWasDone = false

    // scroll controller
    var _controller = new $.superscrollorama({
      triggerAtCenter: false,
      playoutAnimations: false
    })

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
      var id = 'key' + (++_index)
      var _defaults = {
            top: 0,
            height: '20px'
          }

      return $('<div>')
        .css($.extend({}, _defaults, options))
        .attr('id', id)
        .attr('class', function(){
          return options.navigable ? 'navigable': null
        })
        .appendTo(_$timelineEl)
    }

    return {
      /*
        Add a keyframe element and run an animation over the scroll distance equal to the keyframe's height.
        The animation is triggered when window.scrollY == the keyframe's top position.
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

        if (animation){
          _controller.addTween(key, animation, key.height())
        }

        return key
      },

      /*
        retro-transform all keyframe and spacer elements to 'em' units.
        TODO: use 'em' units when generating the elements
      */
      emALLTheThings: function(){
        // make sure we don't em-ize the em units.
        if (_emWasDone){
          return
        }

        var _fontSize = parseInt(window.getComputedStyle(document.body)['font-size'], 10)

        _$timelineEl.find('div').each(function(){
          var $key = $(this)
          $key.css({
            top: parseInt($key.css('top'), 10) / _fontSize + 'em',
            height: parseInt($key.css('height'), 10) / _fontSize + 'em'
          })
        })

        $('.pin-spacer').each(function(){
          $spacer = $(this)
          $spacer.css({
            height: parseInt($spacer.css('height'), 10) / _fontSize + 'em'
          })
        })

        _controller.triggerCheckAnim(true)
        _emWasDone = true
      },

      getKeyframes: function(){
        return _$timelineEl.find('div')
      }
    }

  })()

  var $scene1 = $('#scene1')
  var $scene2 = $('#scene2')
  var $scene3_1 = $('#scene3_1')
  var $scene3_2 = $('#scene3_2')

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
        css: { autoAlpha: 1 },
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
        data: {
          onReverseStart: function(){
            this.vars.onStart.call(this)
          }
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
        css: { autoAlpha: 0 },
        ease: Linear.easeNone,
        immediateRender: false,
        onStart: function(){
          $to.pin('top')
          $spacer.show()
        },
        data: {
          onReverseStart: function(){
            this.vars.onStart.call(this)
          }
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

  // Add a keyframe for the navigation to latch onto and drive to the start
  function setupStart(){
    var keyframe = {
      navigable: true,
      top: 0,
      height: 0
    }

    Timeline.add(keyframe)
  }

  function setupScene1(){

    // target element
    var $el = $('#scene1 p')

    // max amount by which to offset the margin-top
    var maxMargin = $el.height() + $scene1.height() - $el.height() - $el.offset().top

    // keyframe element CSS properties
    var keyframe = {
      top: $el.offset().top / 4,
      height: maxMargin
    }

    // animation description
    var animation = Tween.to($el, 1, {css: { marginTop: maxMargin }})

    // add an empty keyframe for the start of the demo
    setupStart()

    Timeline.add(keyframe, animation)

    // setup crossfade to next scene when the bottom of $scene1 is reached
    crossfade({
      from: $scene1,
      to: $scene2,
      duration: window.innerHeight,
      keyframe: {
        navigable: true
      }
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
    animationAct1.add(Tween.to($act1, 0.75, {css: { autoAlpha: 1, transform:"translateY(70px) rotate(-45deg) scale(0.85)" }}))
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
      height: $act3.height() * 1.5
    }

    Timeline.add(keyframeAct3, animationAct3)
  }

  function setupDialogueScene(){

    var $el = $scene2.find('.act2')
    var $deco = $scene2.find('.decoration')
    var viewportRest = window.innerHeight - $el.height()

    // amount by which to offset the scene horizontally to have the caterpillar act in the viewport
    var hOffset = Math.max(
      Math.abs( window.innerWidth - ($el.offset().left + $el.width()) ),
      $deco.offset().left
    )

    var keyframe = {
      top: $el.offset().top - viewportRest,
      height: $el.height() + hOffset + window.innerHeight // extent
    }

    var dialogueKeyframe = {
      top: keyframe.top + keyframe.height,
      height: window.innerHeight * 5 * 2  // run dialogue over 5 viewport height sizes, x2 for longer animations
    }

    var $spacer = $('<div>')
      .attr('class', 'pin-spacer')
      .css({
        height: keyframe.height + dialogueKeyframe.height
      })
      .insertAfter($scene2)

    // pin scene2 while dialogue animation is playing
    var pin = Tween.to($scene2, 0.2,
      {
        className: '+=pin',
        ease: Linear.easeNone,
        immediateRender: false,
        onStart: function(){
          if ($scene2.css('position') == 'fixed')
            return

          $scene2
            .pin()
            .css({
              top: -1 * $deco.height() + viewportRest + "px"
            })
        },
        data: {
          onReverseStart: function(){
            this.vars.onStart.call(this)
          }
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
        css: { left: -1 * hOffset + 'px' },
        ease: Linear.easeNone,
        immediateRender: false
      }))

    // reveal caterpillar
    animation.add(Tween.to( $el, 1, { className:"+=day" }))

    var dialogueAnimation = getDialogueAnimation()

    // pin and animation added separately because we want them to run at the same time
    Timeline.add(keyframe, pin)
    Timeline.add($.extend({}, keyframe, { navigable: true }), animation)
    Timeline.add(dialogueKeyframe, dialogueAnimation)

    var pinToEnd = function (){
      if ($scene2.css('position') == 'fixed')
        return

      $scene2.pin()
        .css({
          left: -1 * hOffset + 'px',
          top: -1 * $deco.height() + viewportRest + "px"
        })
    }

    // cross-fade between caterpillar scene and cat falling scene
    crossfade({
      from: $scene2,
      to: $scene3_1,
      keyframe: {
        navigable: true,
        // queue the crossfade keyframe after the dialogue keyframe above
        top: dialogueKeyframe.top + dialogueKeyframe.height + window.innerHeight - viewportRest,
        height: window.innerHeight
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

  function getDialogueAnimation(){

    // master timeline
    var anim = new TimelineLite()

    // dialogue 1
    var $d1 = $('#scene2 .dialogue1')
    var $d1Caterpillar = $d1.find('.caterpillar p')
    var $d1Alice = $d1.find('.alice')
    var d1anim = new TimelineLite()

    d1anim.add(Tween.to($d1Caterpillar, 5, {className: "+=visible"}))
    d1anim.add(Tween.to($d1Alice, 2, {className: "+=visible"}))
    d1anim.add(Tween.to($d1Caterpillar, 5, {delay: -1, bezier:[{left:-50, top:-100}, {left:30, top:-150}, {left:-150, top:-300}], ease:Power1.easeInOut}))
    d1anim.add(Tween.to($d1Alice, 2, {className: "+=hidden"}))
    anim.add(d1anim)

    // dialogue 2
    var $d2 = $('#scene2 .dialogue2')
    var $d2Caterpillar = $d2.find('.caterpillar p')
    var $d2Alice = $d2.find('.alice')
    var d2anim = new TimelineLite()

    d2anim.add(Tween.to($d2Caterpillar, 5, {className: "+=visible"}))
    d2anim.add(Tween.to($d2Alice, 2, {className: "+=visible"}))
    d2anim.add(Tween.to($d2Caterpillar, 5, {delay: -1, bezier:[{left:-50, top:-100}, {left:50, top:-150}, {left:220, top:-250}], ease:Power1.easeInOut}))
    d2anim.add(Tween.to($d2Alice, 2, {delay: -1, className: "+=hidden"}))
    anim.add(d2anim)

    // dialogue 3
    var $d3 = $('#scene2 .dialogue3')
    var $d3Caterpillar = $d3.find('.caterpillar p')
    var $d3Alice = $d3.find('.alice')
    var d3anim = new TimelineLite()

    d3anim.add(Tween.to($d3Caterpillar, 5, {className: "+=visible"}))
    d3anim.add(Tween.to($d3Alice, 2, {className: "+=visible"}))
    d3anim.add(Tween.to($d3Caterpillar, 5, {delay: -1, bezier:[{left:50, top:-70}, {left:-20, top:-130}, {left:-70, top:-150}, {left:0, top:-230}], ease:Power1.easeInOut}))
    d3anim.add(Tween.to($d3Alice, 2, {delay: -1, className: "+=hidden"}))
    anim.add(d3anim)

    // dialogue 4
    var $d4 = $('#scene2 .dialogue4')
    var $d4Caterpillar = $d4.find('.caterpillar p')
    var $d4Alice = $d4.find('.alice')
    var d4anim = new TimelineLite()

    d4anim.add(Tween.to($d4Caterpillar, 5, {className: "+=visible"}))
    d4anim.add(Tween.to($d4Alice, 2, {className: "+=visible"}))
    d4anim.add(Tween.to($d4Caterpillar, 5, {delay: -1, bezier:[{left:-50, top:-70}, {left:30, top:-120}, {left:150, top:-150}], ease:Power1.easeInOut}))
    d4anim.add(Tween.to($d4Alice, 2, {delay: -1, className: "+=hidden"}))
    anim.add(d4anim)

    // dialogue 5
    var $d5 = $('#scene2 .dialogue5')
    var $d5Caterpillar = $d5.find('.caterpillar p')
    var $d5Alice = $d5.find('.alice')
    var d5anim = new TimelineLite()

    d5anim.add(Tween.to($d5Caterpillar, 5, {className: "+=visible"}))
    d5anim.add(Tween.to($d5Alice, 2, {className: "+=visible"}))
    d5anim.add(Tween.to($d5Caterpillar, 5, {delay: -1, bezier:[{left:50, top:-30}, {left:-50, top:-70}, {left:-200, top:-160}], ease:Power1.easeInOut}))
    anim.add(d5anim)

    return anim
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
        top: $act5.offset().top + $act5.offset().left - window.innerWidth / 2, // this scene is moving horizontally
        height: window.innerHeight / 2
      }
    }

    Timeline.add($.extend({}, keyframes.enter, {navigable: true}), Tween.from($act5, 1, {css: { autoAlpha: 0, transform:"translateY(-35px)" }}))
    Timeline.add(keyframes.enter, Tween.from($act5.next('p'), 1, {css: { autoAlpha: 0 }}))

    Timeline.add(keyframes.exit, Tween.to($act5, 1, {css: { autoAlpha: 0 }}))
    Timeline.add(keyframes.exit, Tween.to($act5.next('p'), 0.25, {css: { autoAlpha: 0 }}))
  }


  function setupTunnelScene(){

    var $el = $scene3_2
    var $act6 = $scene3_2.find('.act6')

    // custom pixel distance amount over which to run animation
    var extent = 0

    var durations = {
      catHead: window.innerHeight * 2
    }

    // pixel distance to scroll scene horizontally while pinned
    var hOffset = $el.width() - window.innerWidth

    // pixel distance to scroll scene vertically while pinned
    // used in second part of scene: bridge crossing, cat head reveal
    var vOffset = Math.min($act6.position().top, $el.height() - window.innerHeight)

    var keyframe = {
      top: $el.offset().top,
      height: window.innerHeight + $el.width() - window.innerWidth + extent
    }

    // placeholder element to give height and maintain scroll while scene pinned
    var $spacer = $('<div>')
      .attr('class', 'pin-spacer')
      .css({
        // add an extra viewport height to the spacer so the keyframe can play-out completely;
        // the keyframe ends when it exits the upper edge of the viewport
        height: keyframe.height + window.innerHeight + durations.catHead
      })
      .insertAfter($el)

    var scenePin = Tween.to($el, 0.2,
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
        data: {
          onReverseStart: function(){
            this.vars.onStart.call(this)
          }
        },
        onReverseComplete: function(){
          $el
            .unpin()
            .css({
              top: 'auto'
            })
        }
      })

    var sceneAnimation = new TimelineLite()

    // horizontal offset
    sceneAnimation.add(Tween.to( $el, 1,
      {
        css: {
          left: -1 * hOffset / 2 + 'px'
        },
        ease: Linear.easeNone,
        immediateRender: false
      }))

    // vertical offset
    sceneAnimation.add(Tween.to( $el, 1,
      {
        css: {
          left: -1 * hOffset + 'px',
          top: -1 * vOffset + 'px'
        },
        ease: Linear.easeNone,
        immediateRender: false
      }))

    Timeline.add(keyframe, scenePin)
    Timeline.add(keyframe, sceneAnimation)

    // Imporant to be here because they generate keyframes in order. 
    // Keyframe order is important when generating the navigation
    setupCatWalking()
    setupAliceWalking()

    // cat reveal transition
    var $cat = $('#scene3_2 .act6 .cat-head')
    var $states = $cat.find('.state')

    var animation = new TimelineLite()
    animation.defaultEasing = Linear.easeNone

    // fade-in each state, one on top of each other
    $states.each(function(index, state){
      animation.add(Tween.to($(state), 1, {css: { autoAlpha: 1 }}))
    })

    // queue a keyframe after the parent scene's keyframe.
    Timeline.add({
      navigable: true,
      top: keyframe.height + keyframe.top,
      height: durations.catHead,
    }, animation)
  }

  function setupCatWalking(){

    var $el = $('#scene3_2 .act2 .cat-shape-walking')
    var $content = $('#scene3_2 .act2 .content-wrapper p')
    var keyframes = {
      enter: {
        top: $scene3_2.offset().top + $el.offset().left - window.innerWidth / 2,
        height: $el.height()
      },
      exit: {
        top: $scene3_2.offset().top + $el.offset().left - window.innerWidth / 2 + window.innerHeight,
        height: $el.height() / 2
      }
    }

    Timeline.add(keyframes.enter, Tween.from($el, 1, {css: { autoAlpha: 0, transform:"translateX(-20px) rotate(7deg)" }}))
    Timeline.add(keyframes.enter, Tween.from($content, 1, {css: { autoAlpha: 0 }, transform:"translateX(-100px)"}))

    Timeline.add(keyframes.exit, Tween.to($el, 1, {css: { autoAlpha: 0, transform:"translateX(20px) rotate(7deg)" }}))
    Timeline.add(keyframes.exit, Tween.to($content, 1, {css: { autoAlpha: 0 }}))
  }

  function setupAliceWalking(){
    var $act3 = $('#scene3_2 .act3')
    var $act3Alice = $act3.find('.alice-shape')
    var $act3Content = $act3.find('.content-wrapper')

    var $act4 = $('#scene3_2 .act4')
    var $act4Alice = $act4.find('.alice-shape')
    var $act4Content = $act4.find('.content-wrapper')

    var $act5 = $('#scene3_2 .act5')
    var $act5Alice = $act5.find('.alice-shape')

    // master timeline
    var animation = new TimelineLite()

    animation.add(Tween.to($act3Alice, 1, {css: { autoAlpha: 1 }}))
    animation.add(Tween.to($act3Content, 1, { delay: -0.75, css: { autoAlpha: 1 }, transform:"translateX(50px)"}))
    animation.add(Tween.to($act3Alice, 1, {css: { autoAlpha: 0 }}))
    animation.add(Tween.to($act3Content, 1, { delay: -0.5, css: { autoAlpha: 0 }}))
    animation.add(Tween.to($act4Alice, 1, { delay: -0.5, css: { autoAlpha: 1 }}))
    animation.add(Tween.to($act4Content, 1, { delay: -0.75, css: { autoAlpha: 1 }}))
    animation.add(Tween.to($act4Alice, 1, { delay: 0, css: { autoAlpha: 0 }}))
    animation.add(Tween.to($act5Alice, 1, { delay: 0, css: { autoAlpha: 1 }}))

    var keyframe = {
      top: $scene3_2.offset().top + $act3.offset().left - window.innerHeight / 3,
      height: $act5.offset().left - $act3.offset().left
    }

    Timeline.add(keyframe, animation)
  }

  function trans(options){
    var $overlay = $('#overlay')
    var noop = function(){}
    var defaults = {
      duration: 2, // seconds
      onStart: noop,
      onHalfway: noop,
      onComplete: noop
    }
    var config = $.extend({}, defaults, options)
    var animation = new TimelineLite()
    // animation.defaultEasing = Power4.easeOut

    // fade-in
    animation.add(Tween.to($overlay, config.duration / 2,
      {
        ease: Linear.easeIn,
        css: { autoAlpha: 1 },
        onStart: config.onStart
      }
    ))

    // fade-out
    animation.add(Tween.to($overlay, config.duration / 2,
      {
        ease: Cubic.easeOut,
        css: { autoAlpha: 0 },
        onStart: config.onHalfway,
        onComplete: config.onComplete
      }
    ))

    animation.play()
  }

  function nav(){

    var $navEl = $('nav')
    var frag = document.createDocumentFragment()

    // get only keyframes that make sense for navigation; ignore helpers
    var keys = Timeline.getKeyframes().filter('.navigable')

    $navEl.delegate('a', 'click', function(e){
      e.preventDefault()

      var $key = $($(e.target).attr('href'))
      var maxY = $key.offset().top + $key.height()
      var currY = window.scrollY
      var speed = 300 // px/second
      var delta = maxY - window.scrollY
      var distance = Math.abs(maxY - currY)
      var maxDuration = 3 // seconds
      var duration = distance / speed

      // large distance to travel; teleport there
      if (duration > maxDuration){
        trans({
          onHalfway: function(){ window.scrollTo(0, maxY) }
        })
      }
      else{
        TweenMax.to(window, duration, {scrollTo:{y : maxY}, ease:Power2.easeOut});
      }
    })

    // TODO: add a start keyframe in Timeline to be able to go back to top
    $.each(keys, function(index, key){
      frag.appendChild(
        $('<a>').attr({
          href: '#' + key.id
        })[0])
    })

    $navEl.append(frag)
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

    // 'Luke, use the hammer'
    Timeline.emALLTheThings()

    // prevent from working in older Chrome
    if (window.navigator.userAgent.indexOf('Chrome') > -1 && !('onwheel' in window)){
      var html = document.documentElement;
      html.classList.remove('shape-inside')
      html.classList.add('no-shape-inside')
    }

    if (document.documentElement.classList.contains('shape-inside')){
      var delta = 0;
      var maxDelta = 50;
      var $el = $('#intro')

      function listener(e){ 
        e.preventDefault()
        delta += Math.abs(window.scrollY)

        if(delta > maxDelta){
          $el
            .addClass('hide')
            .on('transitionEnd webkitTransitionEnd', function(e){
              $el.remove()
            })

          window.removeEventListener('scroll', listener)
        }
      }

      // remove intro after a short scroll
      window.addEventListener('scroll', listener)
    }
    
    // generate navigation
    // nav()
  }

  // run setup on DOM ready
  $(setup)

  // feather-weight Modernizr-like CSS feature check
  $.each(['shape-inside','flow-into'], function(index, property){

    // check if any variant exists, prefixed or not
    var isCapable = $.some(['-webkit-','-ms-','-moz-',''], function(prefix){
      return prefix + property in document.body.style
    })

    property = isCapable ? property : 'no-' + property;

    document.documentElement.classList.add(property)
  })
  

})()
