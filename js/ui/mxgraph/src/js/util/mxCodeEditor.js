/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 */
var mxCodeEditor =
{
	/**
	 * Class: mxCodeEditor
	 * 
	 * A singleton class that implements a simple JS inspector.
	 * 
	 * Variable: Name
	 * 
	 * Specifies the name of the console window. Default is 'Console'.
	 */
	Name: 'Code Editor',
	
	/**
	 * Variable: TRACE
	 * 
	 * Specified if the output for <enter> and <leave> should be visible in the
	 * console. Default is false.
	 */
	TRACE: false,

	/**
	 * Variable: DEBUG
	 * 
	 * Specifies if the output for <debug> should be visible in the console.
	 * Default is true.
	 */
	DEBUG: true,

	/**
	 * Variable: WARN
	 * 
	 * Specifies if the output for <warn> should be visible in the console.
	 * Default is true.
	 */
	WARN: true,

	/**
	 * Variable: buffer
	 * 
	 * Buffer for pre-initialized content.
	 */
	buffer: '',

    template :
      "var classes = {\n"+
      "  // Type your AgentJS here\n"+
      "  a1 : function () {\n"+
      "    this.act = {\n"+
      "      init : function () {},\n"+
      "      first : function () {}\n"+
      "    };\n"+
      "    this.trans = {\n"+
      "      init : function () {}\n"+
      "    };\n"+
      "    this.next=init;\n"+
      "  }\n"+
      "}\n",
	
	/**
	 * Function: init
	 *
	 * Initializes the DOM node for the console. This requires document.body to
	 * point to a non-null value. This is called from within <setVisible> if the
	 * log has not yet been initialized.
	 */
	init: function()
	{
		if (mxCodeEditor.window == null && document.body != null)
		{
			var title = mxCodeEditor.Name + ' - mxGraph ' + mxClient.VERSION;

			// Creates a table that maintains the layout
			var table = document.createElement('table');
			table.setAttribute('width', '100%');
			table.setAttribute('height', '100%');

			var tbody = document.createElement('tbody');
			var tr = document.createElement('tr');
			var td = document.createElement('td');
			td.style.verticalAlign = 'top';
				
			// Adds the actual console as a textarea
			mxCodeEditor.wrapper = document.createElement('div');
            mxCodeEditor.wrapper.setAttribute('id',mxCodeEditor.Name+'Wrapper');
            mxCodeEditor.wrapper.setAttribute('overflow-y','scroll');
			mxCodeEditor.wrapper.style.height = '100%';
			mxCodeEditor.wrapper.style.resize = 'none';

            
            mxCodeEditor.obj = {};
            mxCodeEditor.callback = function () {};
            
			td.appendChild(mxCodeEditor.wrapper);
			tr.appendChild(td);
			tbody.appendChild(tr);

			// Creates the container div
			tr = document.createElement('tr');
			mxCodeEditor.td = document.createElement('td');
			mxCodeEditor.td.style.verticalAlign = 'top';
			mxCodeEditor.td.setAttribute('height', '30px');
			
			tr.appendChild(mxCodeEditor.td);
			tbody.appendChild(tr);
			table.appendChild(tbody);


            mxCodeEditor.tabs = 
            [{
              name:'Untitled.js',
              modified:false,
              data:''
              }
            ];
            mxCodeEditor.tab=0;
            
			// Adds various  buttons
			mxCodeEditor.addButtonIcon('images/open.gif', function (evt)
			{
				// Open
                mxCodeEditor.popup_load_file.show(mxCodeEditor.editor.getNode(), {pos:'top'});
			});
		
			
			mxCodeEditor.addButtonIcon('images/save.gif', function (evt)
			{
				// Save
                var sourcetext = mxCodeEditor.editor.getValue();
                mxCodeEditor.tabs[mxCodeEditor.tab].data=sourcetext;
                saveTextAsFile(sourcetext, mxCodeEditor.tabs[mxCodeEditor.tab].name);
			});
            
			mxCodeEditor.addButtonIcon('images/close.png', function (evt)
			{
				// Close
			});

			mxCodeEditor.addButtonIcon('images/new.gif', function (evt)
			{ 
				// New
			});

			mxCodeEditor.tabs[mxCodeEditor.tab].button=
              mxCodeEditor.addButton(mxCodeEditor.tabs[mxCodeEditor.tab].name, function (evt)
			  {
				
			  });

			// Cross-browser code to get window size
			var h = 0;
			var w = 0;
			
			if (typeof(window.innerWidth) === 'number')
			{
				h = window.innerHeight;
				w = window.innerWidth;
			}
			else
			{
				h = (document.documentElement.clientHeight || document.body.clientHeight);
				w = document.body.clientWidth;
			}

			mxCodeEditor.window = new mxWindow(title, table, Math.max(0, w - 320), Math.max(0, h - 210), 300, 160);
			mxCodeEditor.window.setMaximizable(true);
			mxCodeEditor.window.setScrollable(false);
			mxCodeEditor.window.setResizable(true);
			mxCodeEditor.window.setClosable(true);
			mxCodeEditor.window.destroyOnClose = false;

            mxCodeEditor.editor = webix.ui({
                id : 'SourceText',
                width:'95%',
                height:100,
                container: mxCodeEditor.wrapper,
                view: "codemirror-editor"
            });

            mxCodeEditor.editor.setValue(mxCodeEditor.template);
            mxCodeEditor.tabs[mxCodeEditor.tab].data=mxCodeEditor.template;
            
            mxCodeEditor.window.addListener(mxEvent.RESIZE_END, function(e) {
               // Resize tree widget, TODO: assuming button bar height = 60
               mxCodeEditor.editor.define('height',mxCodeEditor.window.div.offsetHeight-60);
               mxCodeEditor.editor.resize();
             });
            
            var popup_load_file_id = (Math.random()*1000000)|0;
            mxCodeEditor.popup_load_file=webix.ui({
              view:"popup",
              id:"popup_load_file"+popup_load_file_id,
              body: {
               view:"toolbar", 
               elements:[
                  { template:'<input type="file" id="load_file_input'+popup_load_file_id+'">', width:240 },
                  { view:"button", label:"Ok", width:80, click:function () {
                    loadFileAsText('load_file_input'+popup_load_file_id,function(data,filehandle) {
                      // console.log(filename);
                      //unhighlight('SourceText');
                      mxCodeEditor.tabs[mxCodeEditor.tab].name=filehandle.name;
                      mxUtils.setTextContent(mxCodeEditor.tabs[mxCodeEditor.tab].button,filehandle.name);
                      mxCodeEditor.editor.setValue(data);                     
                      mxCodeEditor.popup_load_file.hide();
                    });
                  }},
                  { view:"button", label:"Cancel", width:80, click:function () {
                    mxCodeEditor.popup_load_file.hide();
                  }}
                ]
              }
            });
		}
	},
	
			
	/**
	 * Function: addButton
	 * 
	 * Adds a button to the console using the given label and function.
	 */
	addButton: function(lab, funct)
	{
		var button = document.createElement('button');
		mxUtils.write(button, lab);
		mxEvent.addListener(button, 'click', funct);
		mxCodeEditor.td.appendChild(button);
        return button;
	},
	addButtonIcon: function(icon, funct)
	{
		var button = document.createElement('button');
		var img = mxUtils.createImage(icon);
        button.appendChild(img);
		mxEvent.addListener(button, 'click', funct);
		mxCodeEditor.td.appendChild(button);
        return button;
	},
				
	/**
	 * Function: isVisible
	 * 
	 * Returns true if the console is visible.
	 */
	isVisible: function()
	{
		if (mxCodeEditor.window != null)
		{
			return mxCodeEditor.window.isVisible();
		}
		
		return false;
	},
	

	/**
	 * Function: show
	 * 
	 * Shows the console.
	 */
	show: function()
	{
		mxCodeEditor.setVisible(true);
	},

	/**
	 * Function: setVisible
	 * 
	 * Shows or hides the console.
	 */
	setVisible: function(visible)
	{
		if (mxCodeEditor.window == null)
		{
			mxCodeEditor.init();
		}

		if (mxCodeEditor.window != null)
		{
			mxCodeEditor.window.setVisible(visible);
		}
	}
	
};
