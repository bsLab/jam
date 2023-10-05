/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 */
var mxInspector =
{
	/**
	 * Class: mxInspector
	 * 
	 * A singleton class that implements a simple JS inspector.
	 * 
	 * Variable: Name
	 * 
	 * Specifies the name of the console window. Default is 'Console'.
	 */
	Name: 'Inspector',
	
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
	
	/**
	 * Function: init
	 *
	 * Initializes the DOM node for the console. This requires document.body to
	 * point to a non-null value. This is called from within <setVisible> if the
	 * log has not yet been initialized.
	 */
	init: function()
	{
		if (mxInspector.window == null && document.body != null)
		{
			var title = mxInspector.Name + ' - mxGraph ' + mxClient.VERSION;

			// Creates a table that maintains the layout
			var table = document.createElement('table');
			table.setAttribute('width', '100%');
			table.setAttribute('height', '100%');

			var tbody = document.createElement('tbody');
			var tr = document.createElement('tr');
			var td = document.createElement('td');
			td.style.verticalAlign = 'top';
				
			// Adds the actual console as a textarea
			mxInspector.treeWrapper = document.createElement('div');
            mxInspector.treeWrapper.setAttribute('id',mxInspector.Name+'TreeWrapper');
            mxInspector.treeWrapper.setAttribute('overflow-y','scroll');
			mxInspector.treeWrapper.style.height = '100%';
			mxInspector.treeWrapper.style.resize = 'none';

            
            mxInspector.obj = {};
            mxInspector.callback = function () {};
            
			td.appendChild(mxInspector.treeWrapper);
			tr.appendChild(td);
			tbody.appendChild(tr);

			// Creates the container div
			tr = document.createElement('tr');
			mxInspector.td = document.createElement('td');
			mxInspector.td.style.verticalAlign = 'top';
			mxInspector.td.setAttribute('height', '30px');
			
			tr.appendChild(mxInspector.td);
			tbody.appendChild(tr);
			table.appendChild(tbody);

			// Adds various  buttons
			mxInspector.addButton('Info', function (evt)
			{
				
			});
		
			
			mxInspector.addButton('Clear', function (evt)
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

			mxInspector.window = new mxWindow(title, table, Math.max(0, w - 320), Math.max(0, h - 210), 300, 160);
			mxInspector.window.setMaximizable(true);
			mxInspector.window.setScrollable(false);
			mxInspector.window.setResizable(true);
			mxInspector.window.setClosable(true);
			mxInspector.window.destroyOnClose = false;

            mxInspector.tree = webix.ui({
                id:mxInspector.Name+'Tree',
	            left:50, top:50,
                width:'100%',
                height:100,
                view:'tree',
                container: mxInspector.treeWrapper,
                type:'lineTree',
                select:true,
                data: [
                    { id:"root", open:true, value:"/"}
                ]
            });
            for(var i = 0;i<20;i++)
              mxInspector.tree.add({id:'d'+i,open:false,value:'d'+i},i,'root');
            mxInspector.tree.refresh();

            mxInspector.window.addListener(mxEvent.RESIZE_END, function(e) {
               // Resize tree widget, TODO: assuming button bar height = 60
               mxInspector.tree.define('height',mxInspector.window.div.offsetHeight-60);
               mxInspector.tree.resize();
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
		mxInspector.td.appendChild(button);
	},
				
	/**
	 * Function: isVisible
	 * 
	 * Returns true if the console is visible.
	 */
	isVisible: function()
	{
		if (mxInspector.window != null)
		{
			return mxInspector.window.isVisible();
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
		mxInspector.setVisible(true);
	},

	/**
	 * Function: setVisible
	 * 
	 * Shows or hides the console.
	 */
	setVisible: function(visible)
	{
		if (mxInspector.window == null)
		{
			mxInspector.init();
		}

		if (mxInspector.window != null)
		{
			mxInspector.window.setVisible(visible);
		}
	}
	
};
