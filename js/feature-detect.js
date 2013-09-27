(function(){ 
  
  // var cookie = document.cookie
  // feather-weight Modernizr-like CSS feature check

  ['shape-inside','flow-into'].forEach(function(property){

    // check if any variant exists, prefixed or not
    var isCapable = ['-webkit-','-ms-','-moz-',''].some(function(prefix){
      return prefix + property in document.body.style 
    })

    property = isCapable ? property : 'no-' + property;

    document.documentElement.classList.add(property)
  })
  
  var skipIntro = /skipintro/.test(document.cookie)
  var el = document.querySelector('#intro')                                  
  
  if (skipIntro){
    el.classList.add('hidden')
  }

  if (document.documentElement.classList.contains('shape-inside') && !skipIntro){
    
    var delta = 0;
    var maxDelta = 30;
    
    function listener(e){
      e.preventDefault()
      delta += Math.abs(e.wheelDelta)
      
      if(delta > maxDelta){
        el.classList.add('hide')
        
        // prevent intro from showing again
        document.cookie = 'skipintro=true'
        
        window.removeEventListener('wheel', listener)
      }
    }    
    window.addEventListener('wheel', listener)
  }
  
})()