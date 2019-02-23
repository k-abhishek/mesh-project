$(window).on("load", function () {
    $(".side-bar").removeClass("no-display");
    function QueryStringToJSON() {            
        var pairs = location.search.slice(1).split('&');
        
        var result = {};
        pairs.forEach(function(pair) {
            pair = pair.split('=');
            result[pair[0]] = decodeURIComponent(pair[1] || '');
        });

        return JSON.parse(JSON.stringify(result));
    }

    var state = QueryStringToJSON();
    if(state != null){
        $('#suggestions').val(state.gene);
        var jsonMap = {},
        xhr = $.getJSON("data/gene_synonym_data.json", function(result){

            $.each(result, function(i, values){

                jsonMap[values.label] = values.value;
            });
            Object.keys(jsonMap).forEach(function(value,index){
                if(state.gene === value){
                    renderfigure(jsonMap[value]);    
                }
            });
        });
        //renderfigure(state.gene);
    }

    $('#suggestions').autocompleter({ source: 'data/gene_synonym_data.json',
                                      focusOpen: false,
                                      limit: 10,
                                      minLength: 2,
                                      template: "{{ label }} <span>({{ value }})</span>",
                                      callback: function(value, index, selected){
                                        
                                        if(selected){
                                            $("#plotLegend").empty();
                                            $("#figure").empty();
                                            $('#suggestions').val(selected.label);
                                            $(".loader").removeClass("no-display");
                                            $(".data-table").addClass("no-display");
                                            history.pushState({"gene":selected.label}, "","?gene="+selected.label);
                                            window.setTimeout(function(){renderfigure(value)}, 256);
                                        }
                                      }
                                  });

    function renderfigure(geneName){

        var m = [10, 150, 10, 150],
            w = 1280 - m[1] - m[3],
            h = 800 - m[0] - m[2],
            i = 0,
            root;

        var SCALE_FACTOR = 7;
        var selectedPath = [];
        var gene = geneName;
        var values_map_json = "data/" + gene + "_mesh_values_map_sum.json";

        // Define the div for the tooltip
        var div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        var tree = d3.layout.cluster()
                            .size([h, w])
                            .separation(function separation(a, b) {
                                return a.parent == b.parent ? 1 : 1;
                            });

        var diagonal = d3.svg.diagonal()
            .projection(function(d) { return [d.y, d.x]; });

        var vis = d3.select("#figure").append("svg:svg")
            .attr("width", w + m[1] + m[3])
            .attr("height", h + m[0] + m[2])
            .append("svg:g")
            .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

        var values_map = {};
         $.ajax({
                type: 'GET',
                url: values_map_json,
                dataType: 'json',
                success: function(data){ 
                    values_map = data
                },
                data: {},
                async: false
            });
        // bubble plot variables
        var plot_offset = 300;
        var jsonPath = null;
        var radius = null;
        var sample_names = Object.keys(values_map[Object.keys(values_map)[0]]);
        /*var new_samples = sample_names.filter(function(value){
            return(value == "NumAssocDis" || value == "MaxSemanticAssociation")
        });*/
        var new_samples = ["NumAssocDis","MaxSemanticAssociation"]
        console.log(new_samples)
        sample_names = new_samples;
        var legend_names= ["Number of Associated Diseases","Maximum Semantic Association"];
        var samples = sample_names.length;
        var trans = 0.5;
        var colors = ["red", "blue", "green", "orange", "purple","pink" ];

        // pie stuff
        var arc = d3.svg.arc()
            .outerRadius(radius * 0.8)
            .innerRadius(radius * 0.4);

        var outerArc = d3.svg.arc()
            .innerRadius(radius * 0.9)
            .outerRadius(radius * 0.9);

        var pie = d3.layout.pie()
        .sort(null)
        .value(function(d) {
            return d.value;
        });

        var searchMap = null;

        xhr = $.getJSON("data/new_final_disease_token_map.json", function(result){

            searchMap = result;
        });
        function createDataOnclick(parentNode){

              var result = [],childrenNode = null;
              if(!parentNode.values){
                  parentNode._children == null ? childrenNode = parentNode.children : childrenNode = parentNode._children;
              }
              else{
                  return 
              }
              childrenNode.forEach(function(res, index){
                
                  var childData = values_map[res.name], childNum = null;
                  childData["name"] = res.name;
                  /*if(res._children == null && !res.values){
                    childNum = res.children;
                  }else if(res._children == undefined && res.children == undefined){
                    childNum = [];
                  }else{
                    childNum = res._children;
                  }*/
                  var d = traverseNode(res);
                  //childData["NumAssocDis"] = Object.keys(d).length ;
                  result.push(childData);
              });

              return result
          }

      function createData(jsonVal){
           var result = [];
           Object.keys(jsonVal).forEach(function(key, value){
                var childData = jsonVal[key];
                childData["name"] = key;
                //childData["childNumber"] = "";
                result.push(childData);
           });
           return result;
      }

      var child = {};
      var traverseNode = function(parentNode){

            var node  = null;
            if(parentNode.values){
                child[parentNode.name]= "";
            }else{
                (parentNode._children == null) ? node = parentNode.children : node = parentNode._children;
                node.forEach(function(item){

                    traverseNode(item);
                });
            }
            return child;
      }

        var data = createData(values_map),
          table = $("#children-table").DataTable({"destroy":true,
                                                "bLengthChange": false,
                                                "bAutoWidth": false,
                                                "data": data,
                                                "responsive": true,
                                                "bInfo": false,
                                                "searching": true,
                                                "language": { 
                                                    "search": "_INPUT_",
                                                    "searchPlaceholder": "Search for disease",
                                                },
                                                "ordering": true,
                                                /*"columnDefs": [
                                                    { "mRender": function (data, type, full) {
                                                                    return parseFloat(data).toFixed(2);
                                                            },
                                                    "aTargets": [ 2 ] },
                                                    {
                                                        "targets": [ 3 ],
                                                        "visible": false
                                                    }
                                                ],*/
                                                "columns": [
                                                    { "data": "name", "width":"17%" },
                                                    { "data": "MinNovelty", "width":"18%"},        
                                                    { "data": "SigDis" , "width":"20%"},
                                                    //{ "data": "MaxSemanticAssociation", "width":"15%"},
                                                    { "data": "NumAssocDis", "width":"18%"},
                                                    { "data": "Level", "width":"12%"},
                                                ]
                                                });
            $(".data-table").removeClass("no-display");
            $("#children-table_filter input").focus(function(){

                table.clear().draw();
                table.rows.add(createData(values_map));
                table.columns.adjust().draw();
                //table.columns(3).visible(false);
            });

        // quick crawl of tree to load sample_names
        // variable
        function initializeSampleNames(d){
            if(d.values) {
                if (sample_names.length == 0) {
                    for (var sample_name in d.values) {
                            sample_names.push(sample_name);
                    }
                }
            }
            if (d.children) {
                for (var i=0; i < d.children.length; i++) {
                    initializeSampleNames(d.children[i]);
                }
            } else if (d._children) {
                for (var i=0; i < d._children.length; i++) {
                    initializeSampleNames(d._children[i]);
                }
            }
        }

        function get_max_value(){
          var max = 1.00;

          Object.keys(values_map).forEach(function(row, i){
            if (row !== "Mesh"){
              if (values_map[row]){
                if (parseFloat(values_map[row].MaxSemanticAssociation) > max){
                    max = parseFloat(values_map[row].MaxSemanticAssociation);
                }
                if (parseFloat(values_map[row].NumAssocDis) > max){
                    max = parseFloat(values_map[row].NumAssocDis)
                }
                /*if (parseFloat(values_map[row].MinNovelty) > max){
                    max = parseFloat(values_map[row].MinNovelty)
                }*/
              }
            }   
          })
          return max;
        }

        d3.json("data/" + gene + "_mesh_processed.json", function(json) {
          root = json;
          root.x0 = h / 2;
          root.y0 = 0;

          var mapToDisease = {};
          function createMapSearch(node, wholeData, par){

           var keyArray = Object.keys(wholeData);
           node.push(par);
           if(keyArray[1] == "children"){
                wholeData["children"].forEach(function(index){
                    if(!index.values){
                        mapToDisease[index.name] = node;
                        createMapSearch(node.slice(),index, index["name"]);
                        //node = node.splice(-1,1);
                    } else{
                        mapToDisease[index.name] = node;
                    }
                });
           }           
            return mapToDisease;
          }
          jsonPath = createMapSearch([],json, "Mesh");
          //console.log(jsonPath);

          // set full node status of all nodes
          function toggleAll(d) {
            if (d.children) {
              d.children.forEach(toggleAll);
              toggle(d);
            }
          }

          // sets leaf status of all nodes to false
          initializeLeaves(root);
          root._leaf = true;

          // Initialize the display to show a few nodes.
          root.children.forEach(toggleAll);

          // Set max bubble size to max samples
          max_size = get_max_value()

        

          /*radius = d3.scale.log().base(10)
                           .domain([1, 5])
                           .range([0, 30]);
          radius.clamp(true);*/


          radius = function(value) {
              value = Math.max(1.0, value);
              var radius = Math.log10(value);
              radius = radius *SCALE_FACTOR;
              return radius;
          }
        
          var legendPlot = d3.select("#plotLegend").append("svg:svg")
                            .attr("width", w + m[1] + m[3])
                            .attr("height", h + m[0] + m[2])
                            .append("svg:g")
                            .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

          var legend = legendPlot.append("g")
                          .attr("class", "legend")
                          .attr("transform", "translate(" + (30) + "," + (85) + ")")
                          .selectAll("g")
                          .data([Math.round(max_size), Math.round(max_size/2)])
                          .enter().append("g");

         legend.append("circle")
             .attr("cy", function(d, i) { return -(i+0.5)*radius(d); })
             .attr("r", function(d, i){ return (i+0.9)*radius(d*30);});

         legend.append("text")
             .attr("y", function(d,i) { return -Math.log(d)/(i+0.2); })
             .attr("dy", "-1.6em")
             .text(d3.format(".1s"));

          var color_legend = legend.append("g")
                                .attr("class", "inner_legend")
                                .attr("transform", "translate(" + (0) + "," + (45) + ")")
                                .selectAll("g")
                                .data(legend_names)
                                .enter().append("g");
          d3.select(".inner_legend").selectAll("text").attr("x", "-60")
          /*legendPlot.append("text")
              .attr("x", 17)
              .attr("y", 30)
              .text(gene)*/

          color_legend.append("circle")
                          .attr("cy", function(d,i) { return i*20; })
                          .attr("r", 8)
                          .style("fill", function(d,i) {
                                    return colors[i];
                                 })
                          .attr("opacity", trans);
          color_legend.append("text")
                .attr("y", function(d,i) { return i*20; })
                .attr("dy", 4)
                .attr("x", -90)
                .text(function(d,i) {
                    return d
                });

          toggle(root);
          update(root);

        });

        function getChildrenNames(parent) {
            children = parent.children;
            for (i = 0; i < children.length; i++) {
                // alert(children[i]["size"]);
            }
        }

        var nodes = null;

        function update(source) {

          var duration = d3.event && d3.event.altKey ? 5000 : 500;

          // Compute the new tree layout.
          nodes = tree.nodes(root).reverse();

          // Normalize for fixed-depth.
          nodes.forEach(function(d) { d.y = d.depth * 130; });

          

          // Update the nodes…
          var node = vis.selectAll("g.node")
                        .data(nodes, function(d) { return d.id || (d.id = ++i); });

        // Enter any new nodes at the parent's previous position.
          var nodeEnter = node.enter().append("svg:g")
              .attr("class", "node")
              .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
              .on("click", function(d) {
                        var data, node = null;
                        if(d._children == null){
                            d.parent == undefined ? node = d.children : node = d.parent;
                            data = createDataOnclick(node);
                        }else{
                            data = createDataOnclick(d);
                        }
                        if(data){
                            table.clear().draw();
                            table.rows.add(data);
                            table.columns.adjust().draw();
                            table.columns(3).visible(true);
                        }
                        if(d == root){
                            toggleSelectedPath(selectedPath, true);
                        }
                        selectedPath.push(d);
                        update_leaf(d); 
                        toggle(d); 
                        update(d);
              })
              .on("mouseover", function(d) {
                    if(d.name != "Mesh"){
                        var childrenNodes = 0, token2 = null;
                        
                div.transition()
                   .duration(200)
                   //.style("visibility", "visible")
                   .style("opacity", .9);
                if(!d.values){
                    d._children == null ? childrenNodes = d.children.length : childrenNodes = d._children.length;
                }
                /*var q = traverseNode(d);
                var diseaseList = Object.keys(q).slice(0, 3).join(", ");*/
                var minYearOfEm = "NA";
                if(searchMap.hasOwnProperty(d.name)){
                    token2 = searchMap[d.name];
                }else{
                    token2 = d.name;
                }
                var tt_data = values_map[d.name]
                if (tt_data["MinYearofEmergence"] != 0) {
                    minYearOfEm = tt_data["MinYearofEmergence"];
                }
                div.html("<div class='tooltip-inner-div'><h4 class='text-center'>"+ d.name + "</h2><br/>" + "Total Associated Diseases: " + 
                    tt_data['NumAssocDis'] + "<br/>" + " Minimum Novelty of Branch: " +
                    tt_data["MinNovelty"] + "<br/>" + 
                    " Minimum Years of Emergence: " + minYearOfEm  + "<br/>" +
                     " Maximum Semantic Association: " + 
                     tt_data['MaxSemanticAssociation'] + "<br/>" +
                    "Top Diseases found in this branch: " + tt_data['SigDis'] +"</br></br>" +
                    "Learn More: </br><a target='_blank' href='/compare/?term1="+gene+"&term2="+token2+"&server=corpus'>                            Association History </a></div>")
                      .style("left", (d3.event.pageX) + "px")
                      .style("top", (d3.event.pageY - 20) + "px");
                        child = [];
                    }
                }).on("mouseout", function(d) {
                div.transition()
                   .duration(2000)
                   .style("opacity", 0);
                   //div.empty();
                });

          nodeEnter.append("svg:circle")
              .attr("r", 1e-6)
              .attr("class", "node_circle")
              .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

          //create_slices(nodeEnter);

          nodeEnter.append("svg:text")
              .attr("class", "node_name")
              .attr("x", function(d) { return d.children || d._children ? -10 : -10; })
              .attr("y", 10)
              .attr("dy", "-0.80em")
              .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "end"; })
              .text(function(d) { return d.name; })
              .style("fill-opacity", 1e-6);

          // circle that appears when leaf
          create_leaf_nodes(nodeEnter);
          $(".loader").addClass("no-display");

          // Transition nodes to their new position.
          var nodeUpdate = node.transition()
              .duration(duration)
              .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

          // update leaf nodes with colors
          update_leaf_nodes(nodeUpdate);

          nodeUpdate.select("circle.node_circle")
              .attr("r", function(d) {return 6;} )
              .style("fill", function(d) { return d._children ? "#CECECE" : "#fff"; });

          nodeUpdate.select("text")
              .style("fill-opacity", 1);

          // Transition exiting nodes to the parent's new position.
          var nodeExit = node.exit().transition()
              .duration(duration)
              .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
              .remove();

          nodeExit.select("circle")
              .attr("r", 1e-6);
          nodeExit.select("text")
              .style("fill-opacity", 1e-6);
          nodeExit.select(".leaf")
              .style("r", 1e-6)
              .attr("opacity", 0);

          // Update the links…
          var link = vis.selectAll("path.link")
              .data(tree.links(nodes), function(d) { return d.target.id; });

          // Enter any new links at the parent's previous position.
          link.enter().insert("svg:path", "g")
              .attr("class", "link")
              .attr("d", function(d) {
                var o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
              })
            .transition()
              .duration(duration)
              .attr("d", diagonal);

          // Transition links to their new position.
          link.transition()
              .duration(duration)
              .attr("d", diagonal);

          // Transition exiting nodes to the parent's new position.
          link.exit().transition()
              .duration(duration)
              .attr("d", function(d) {
                var o = {x: source.x, y: source.y};
                return diagonal({source: o, target: o});
              })
              .remove();

          // Stash the old positions for transition.
          nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
          });
        }

        $('#children-table tbody').on('click', 'tr', function() {
            //var rowDetails = table.row(this).data().name;
            var rowDetails = this.firstElementChild.innerText;
            if(nodes[0] != root){
                toggleSelectedPath(selectedPath, false);
            }
            var updateNodes = nodes[0], isChildrenNode = null;
            jsonPath[rowDetails].forEach(function(value, index){
                
                if(updateNodes.name == value) {
                    update_leaf(updateNodes); 
                    toggle(updateNodes); 
                    update(updateNodes);
                }else {
                    updateNodes.children == null? isChildrenNode = updateNodes._children : isChildrenNode = updateNodes.children
                    isChildrenNode.some(function(child){
                        if(child.name == value){
                            update_leaf(child); 
                            toggle(child); 
                            update(child);
                            updateNodes = child;
                            scrollTo((((document.body.clientWidth)/4) + child.y ), (child.x - 10));
                            return true;
                        }
                    });                           
                }
                if(index == (jsonPath[rowDetails].length-1)){
                    updateNodes.children == null? isChildrenNode = updateNodes._children : isChildrenNode = updateNodes.children
                    isChildrenNode.forEach(function(selected){
                        if(selected.name == rowDetails){

                            d3.selectAll("text").attr("fill", "#000000")
                              .style("font-size", "7px");
                            d3.selectAll("text")
                              .filter(function(){ 
                                return d3.select(this).text() == selected.name
                              }).attr("fill", "#FC1818")
                                .style("font-size", "10px");
                        }
                    });
                }
                selectedPath.push(updateNodes);
            });
            //selectedPath=[];
        });

        function toggleSelectedPath(path, meshClick){

            if(path){
                path = path.reverse();
                if(meshClick){
                    path.pop();
                }
                path.forEach(function(val){
                
                    if(!val._leaf){
                        update_leaf(val);
                        toggle(val);
                        update(val);
                    }
                });
            }
            selectedPath =[];
        }
        // Toggle children.
        function toggle(d) {
          if (d.children) {
            // hide children
            d._children = d.children;
            d.children = null;
          } else {
            // show children
            d.children = d._children;
            d._children = null;
          }
        }

        // Update leaf status of children on click
        function set_children_leaves(d) {
            // update leaf status
            if (d.children) {
                children = d.children;
            } else if (d._children) {
                children = d._children;
            }

            for (i = 0; i < children.length; i++) {
                // alert("leaf " + children[i]["name"]);
                children[i]._leaf = true;
            }
        }

        function update_leaf(d) {
            if (d._leaf) {
              // if currently a leaf, expand and make children leaves
              d._leaf = false;

              if(d.children) {
                  d.children.forEach(function(d){ d._leaf = true;});
              } else if (d._children){
                  d._children.forEach(function(d){ d._leaf = true;});
              }
            } else {
              // if not a leaf, collapsing up traverse all setting leaves to false
              d._leaf = true;
              if(d.children) {
                d.children.forEach(initializeLeaves);
              } else if (d._children){
                d._children.forEach(initializeLeaves);
              }
            }
        }

        // sets current leaf and all children leaves to false
        function initializeLeaves(d) {
          d._leaf = false;
          if (d.children) {
              d.children.forEach(initializeLeaves);
          } else if (d._children) {
              d._children.forEach(initializeLeaves);
          }
        }

        function sumCountsBySample2(d, sample){
          if (!values_map[d.name]){
            return 0
          }
          if (d.name === 'Vaginal Fistula'){

          }
            return values_map[d.name][sample]
        }

        function hideChildren(d) {
            if(d.children) {
                d._children = d.children;
                d.children.forEach(hideChildren)
                d.children = null;
            }
        }

        // Toggle leaf status of node
        function toggle_leaf(d) {
            if (d._leaf){
                d._leaf = false;
            } else {
                d._leaf = true;
            }
        }

        function create_leaf_nodes(nodeEnter) {
            for (itr2 = 0; itr2 < samples; itr2++) {
                nodeEnter.append("svg:circle")
                         .attr("class", "leaf")
                         .attr("cx", (itr2 + 1) * 30)
                         //.attr("r", 1e-6)
                         .attr("opacity", 0)
                         .style("fill", function(d) { return d._leaf ? colors[itr2] : "#fff"; });
            }
        }

        function update_leaf_nodes(nodeUpdate) {
           // console.log("In update_leaf_nodes");
            leaf_circles = nodeUpdate.selectAll("circle.leaf")
                              .transition()
                              .attr("r", function(d,i) {
                                  //console.log('getting r')
                                  //console.log(sample_names[i])
                                  //value = sumCountsBySample2(d,sample_names[i]);
                                  value = values_map[d.name][sample_names[i]];
                                  //console.log(value)
                                  return(radius(value));
                              })
                              .attr("opacity", function(d,i) {
                                  if (d._leaf) {
                                      return(trans);
                                  } else {
                                      return(0);
                                  }

                              });

        }
    }
});

