function animated_learning() {

  var svg = d3.select("#animation").select("svg")

  var x = d3.scaleLinear().range([200,500]).domain([0,1])

  var learning_rate = 0.2
  var hist_n = 15

  var As = []
  var Bs = []
  var As_visible = []
  var Bs_visible = []

  var n_As, n_Bs, n_pairs, n_As_visible, n_Bs_visible, show_histogram, show_uncertainty

  function restart_animation() {

    // read simulation control values
    n_As = +document.getElementById('n_As').value
    n_Bs = +document.getElementById('n_Bs').value
    n_pairs = +document.getElementById('n_pairs').value
    n_As_visible = +document.getElementById('n_As_visible').value
    n_Bs_visible = +document.getElementById('n_Bs_visible').value
    show_uncertainty = document.getElementById('show_uncertainty').checked
    show_histogram = document.getElementById('show_histogram').checked
    sim_speed = +document.getElementById('sim_speed').value

    // create elements with latent values and initial positions
    As = []
    for (var i=0; i < n_As; i++){
      As.push({id: i, latent_value: Math.random(),
                    current_position: 0.5, next_position: 0.5,
                    current_n_tests: 0, next_n_tests: 0})
    }
    Bs = []
    for (var i=0; i < n_Bs; i++){
      Bs.push({id: i, latent_value: Math.random(),
                   current_position: 0.5, next_position: 0.5,
                   current_n_tests: 0, next_n_tests: 0})
    }

    // construct circles

    As_visible = As.slice(0, n_As_visible)
    Bs_visible = Bs.slice(0, n_Bs_visible)

    svg.selectAll(".A").remove()
    svg.selectAll(".B").remove()

    svg.selectAll(".A").data(As_visible, function(d){ return d.id; })
      .enter().append("circle")
        .attr("class", "A A-color")
        .attr("cx", 350)
        .attr("cy", 230)
        .attr("r", 3)

    svg.selectAll(".B").data(Bs_visible, function(d){ return d.id; })
      .enter().append("circle")
        .attr("class", "B B-color")
        .attr("cx", 350)
        .attr("cy", 270)
        .attr("r", 3)

  }

  function animation_step(){

    // *** SIMULATION ***

    var pairs = []

    for (var i=0; i < n_pairs; i++) {
      var A_id = Math.floor(Math.random()*n_As)

      // pair selection a stochastic function of distance from respective current positions
      var weights = Bs.map(function(d){ return d.current_position - As[A_id].current_position; })
      var cum_weights = []
      weights.reduce(function(a,b,i) { cum_weights[i] = {v: a+b, id:i}; return a + b; },0)
      cum_weights = cum_weights.sort(function(a,b){ return a.v > b.v; })
      var B_id = Math.floor(Math.random()*n_Bs)
      if (cum_weights[cum_weights.length - 1].v != 0) {
        var sel_random = Math.random() * cum_weights[cum_weights.length - 1].v
        var sel = cum_weights.find(function(d){ return d.v >= sel_random; })
        if (!(sel == null)) {
          B_id = sel.id
        }
      }

      pairs.push({A_id: A_id, B_id: B_id})

      // for uncertainty calc
      As[A_id].next_n_tests += 1
      Bs[B_id].next_n_tests += 1

      // big = 1, small = -1
      var feedback = -1 + 2 * (As[A_id].latent_value > Bs[B_id].latent_value)

      // use feedback if it contradicts current
      if ((feedback == -1) && (As[A_id].current_position <= Bs[B_id].current_position)) {
        As[A_id].next_position = As[A_id].current_position + Math.random() * learning_rate
        Bs[B_id].next_position = Bs[B_id].current_position - Math.random() * learning_rate
      }

      if ((feedback == 1) && (As[A_id].current_position >= Bs[B_id].current_position)) {
        As[A_id].next_position = As[A_id].current_position - Math.random() * learning_rate
        Bs[B_id].next_position = Bs[B_id].current_position + Math.random() * learning_rate
      }

      As[A_id].next_position = Math.min(1, Math.max(0, As[A_id].next_position))
      Bs[B_id].next_position = Math.min(1, Math.max(0, Bs[B_id].next_position))

    }

    // *** SVG ANIMATION ***

    var delay = 400 * 25 / sim_speed
    var move = 500 * 25 / sim_speed
    var wait = 300 * 25 / sim_speed

    // histograms

    var A_hist_dy = 200 / n_As
    var A_hist = []
    for (var i=0; i < hist_n; i++) {
      var this_count = 0
      As.forEach(function(d){
        if ((d.current_position >= i/hist_n) && (d.current_position < (i+1)/hist_n)) {
          this_count += 1
        }
      })
      A_hist.push(this_count)
    }

    var B_hist_dy = 200 / n_Bs
    var B_hist = []
    for (var i=0; i < hist_n; i++) {
      var this_count = 0
      Bs.forEach(function(d){
        if ((d.current_position >= i/hist_n) && (d.current_position < (i+1)/hist_n)) {
          this_count += 1
        }
      })
      B_hist.push(this_count)
    }

    // prep for visible parts of sim

    As_visible = As.slice(0, n_As_visible)
    Bs_visible = Bs.slice(0, n_Bs_visible)

    pairs = pairs.filter(function(d){
      var keep = true
      if (d.A_id >= n_As_visible) { keep = false; }
      if (d.B_id >= n_Bs_visible) { keep = false; }
      return keep
    })

    // draw and animate pair lines

    svg.selectAll(".pair").remove()

    svg.selectAll(".pair").data(pairs).enter().append("line")
      .attr("class", "pair")
      .attr("y1", 230)
      .attr("y2", 270)
      .style("stroke", "#000")
      .style("stroke-width", 0.25)
      .style("fill", "none")
      .attr("x1", function(d){ return x(As[d.A_id].current_position); })
      .attr("x2", function(d){ return x(Bs[d.B_id].current_position); })
      .transition().delay(delay).duration(move)
        .attr("x1", function(d){ return x(As[d.A_id].next_position); })
        .attr("x2", function(d){ return x(Bs[d.B_id].next_position); })

    // animate circles

    svg.selectAll(".A")
      .transition().delay(delay).duration(move)
        .attr("cx", function(d){ return x(d.next_position); })

    svg.selectAll(".B")
      .transition().delay(delay).duration(move)
        .attr("cx", function(d){ return x(d.next_position); })

    // animate uncertainty bands (if applicable)

    svg.selectAll(".A_uncertainty").remove()
    svg.selectAll(".B_uncertainty").remove()

    if (show_uncertainty) {

      svg.selectAll(".A_uncertainty").data(As_visible, function(d){ return d.id; })
        .enter().append("rect")
          .attr("class", "A_uncertainty A-color")
          .style("opacity", 0.25)
          .attr("y", 227)
          .attr("height", 6)
          .attr("x", function(d){ return x(d.current_position) - 150 / (1 + d.current_n_tests); })
          .attr("width", function(d){ return 300 / (1 + d.current_n_tests); })
          .transition().delay(delay).duration(move)
            .attr("x", function(d){ return x(d.next_position) - 150 / (1 + d.next_n_tests); })
            .attr("width", function(d){ return 300 / (1 + d.next_n_tests); })

      svg.selectAll(".B_uncertainty").data(Bs_visible, function(d){ return d.id; })
        .enter().append("rect")
          .attr("class", "B_uncertainty B-color")
          .style("opacity", 0.25)
          .attr("y", 267)
          .attr("height", 6)
          .attr("x", function(d){ return x(d.current_position) - 150 / (1 + d.current_n_tests); })
          .attr("width", function(d){ return 300 / (1 + d.current_n_tests); })
          .transition().delay(delay).duration(move)
            .attr("x", function(d){ return x(d.next_position) - 150 / (1 + d.next_n_tests); })
            .attr("width", function(d){ return 300 / (1 + d.next_n_tests); })

    }

    // animate histogram (if applicable)

    svg.selectAll(".A_hist").remove()
    svg.selectAll(".B_hist").remove()

    if (show_histogram) {

      svg.selectAll(".A_hist").data(A_hist).enter().append("rect")
        .attr("class", "A_hist A-color")
        .style("opacity", 0.25)
        .attr("x", function(d,i){ return x(i/hist_n); })
        .attr("y", function(d){ return 220 - A_hist_dy * d; })
        .attr("width", 300 / hist_n)
        .attr("height", function(d){ return A_hist_dy * d; })

      svg.selectAll(".B_hist").data(B_hist).enter().append("rect")
        .attr("class", "B_hist B-color")
        .style("opacity", 0.25)
        .attr("x", function(d,i){ return x(i/hist_n); })
        .attr("y", 280)
        .attr("width", 300 / hist_n)
        .attr("height", function(d){ return B_hist_dy * d; })

    }

    // *** end of svg animation code ***

    // prep next timestep

    As.forEach(function(d){
      d.current_position = d.next_position
      d.current_n_tests = d.next_n_tests
    })

    Bs.forEach(function(d){
      d.current_position = d.next_position
      d.current_n_tests = d.next_n_tests
    })

    anim_interval = d3.timeout(animation_step, (delay + move + wait))


  }


  // control elements on-change behaviors

  d3.select("#animated_learning_restart").on("click", function(){
    restart_animation()
  })

  d3.select("#show_uncertainty").on("click", function(){
    show_uncertainty = document.getElementById('show_uncertainty').checked
  })

  d3.select("#show_histogram").on("click", function(){
    show_histogram = document.getElementById('show_histogram').checked
  })

  d3.select("#sim_speed").on("change", function(){
    sim_speed = +document.getElementById('sim_speed').value
  })


  // start simulation / animation
  restart_animation()
  anim_interval = d3.timeout(animation_step, 500)

}
