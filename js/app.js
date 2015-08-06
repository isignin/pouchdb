(function() {

  'use strict';

  var ENTER_KEY = 13;
  var save_form = document.getElementById('save-form');
  var syncDom = document.getElementById('sync-wrapper');

  // EDITING STARTS HERE (you dont need to edit anything above this line)

  var db = new PouchDB('aspirin');
  var remoteCouch = "http://10.254.164.30:5984/aspirin";

  db.changes({
	  since: 'now',
	  live: true
  }).on('change', showDocs);
  
  // We have to create a new form document and enter it in the database
  function addForm() {
	  var legalAged = document.getElementById('legal_aged_yes').checked ? "Yes" : (document.getElementById('legal_aged_no').checked ? "No" : "");
	  var firstPregnancy = document.getElementById('first_pregnancy_yes').checked ? "Yes" : (document.getElementById('first_pregnancy_no').checked ? "No" : "");
	  var permanentResident = document.getElementById('permanent_resident_yes').checked ? "Yes" : (document.getElementById('permanent_resident_no').checked ? "No" : "");
	  var weeksGestation = document.getElementById('weeks_gestation_yes').checked ? "Yes" : (document.getElementById('weeks_gestation_no').checked ? "No" : "");
	  var eligibility = document.getElementById('eligibility_yes').checked ? "Yes" : (document.getElementById('eligibility_no').checked ? "No" : "");
	  var consentStatus = document.getElementById('consent_status_yes').checked ? "Yes" : (document.getElementById('consent_status_no').checked ? "No" : "");
	  
	  var answer = {
		  _id: new Date().toISOString(),
		  screening_id: document.getElementById('screening_id').value,
		  mnh_id: document.getElementById('mnh_id').value,
		  date_visit: document.getElementById('date_visit').value,
		  age: document.getElementById('age').value,
		  estimate_age: document.getElementById('estimate_age').value,
		  legal_aged: legalAged,
		  permanent_resident: permanentResident,
		  first_pregnancy: firstPregnancy,
		  date_lmp: document.getElementById('date_lmp').value,
		  ga_current_pregnancy: document.getElementById('ga_current_pregnancy').value,
		  weeks_gestation: weeksGestation,
		  eligibility: eligibility,
		  consent_status: consentStatus,
		  date_consent: document.getElementById('date_consent').value,
		  interviewer_id: document.getElementById('interviewer_id').value,
		  date_completed: document.getElementById('date_completed').value,
		  reviewer_id: document.getElementById('reviewer_id').value,
		  date_reviewed: document.getElementById('date_reviewed').value,
		  data_entry_id: document.getElementById('data_entry_id').value,
		  date_data_entry: document.getElementById('date_data_entry').value,
		  completed: document.getElementById('form_complete').checked
	  };
	
	  db.put(answer, function callback(err,result){
		  if (!err){
			  console.log('Successfully saved the form!');
			  showDocs();
			  clearForm();
		  } else {
		  	console.log('Error encountered saving the form!');
		  }
	  });
  }
  
  // clear form fields after saving
  function clearForm(){
  	$('input').val('');
	$('input[type=radio]').attr('checked',false);
  }

  // Show the current list of documents by reading them from the database
  function showDocs() {
	  db.allDocs({include_docs: true, descending: true}, function(err, doc){
		  redrawTodosUI(doc.rows);
	  });
  }

  function checkboxChanged(todo, event) {
	  todo.completed = event.target.checked;
	  db.put(todo);
  }

  // User pressed the delete button for a todo, delete it
  function deleteButtonPressed(todo) {
	  db.remove(todo);
  }

  // The input box when editing a todo has blurred, we should save
  // the new title or delete the todo if the title is empty
  function todoBlurred(todo, event) {
	  var trimmedText = event.target.value.trim();
	  if (!trimmedText){
		  db.remove(todo);
	  } else {
		  todo.totle = trimmedText;
		  db.put(todo);
	  }
  }

  // Initialise a sync with the remote server
  function sync() {
	  syncDom.setAttribute('data-sync-state','syncing');
	  var opts = {live: true};
	  //db.sync(remoteCouch, opts, syncError);	  
	  db.replicate.to(remoteCouch, opts, syncError);
	  db.replicate.from(remoteCouch, opts, syncError);
  }

  // EDITING STARTS HERE (you dont need to edit anything below this line)

  // There was some form or error syncing
  function syncError() {
    syncDom.setAttribute('data-sync-state', 'error');
  }

  // User has double clicked a todo, display an input so they can edit the title
  function todoDblClicked(todo) {
    var div = document.getElementById('li_' + todo._id);
    var inputEditTodo = document.getElementById('input_' + todo._id);
    div.className = 'editing';
    inputEditTodo.focus();
  }

  // If they press enter while editing an entry, blur it to trigger save
  // (or delete)
  function todoKeyPressed(todo, event) {
    if (event.keyCode === ENTER_KEY) {
      var inputEditTodo = document.getElementById('input_' + todo._id);
      inputEditTodo.blur();
    }
  }

  // Given an object representing a todo, this will create a list item
  // to display it.
  function createTodoListItem(todo) {
    var checkbox = document.createElement('input');
    checkbox.className = 'toggle';
    checkbox.type = 'checkbox';
    checkbox.addEventListener('change', checkboxChanged.bind(this, todo));

    var label = document.createElement('label');
    label.appendChild( document.createTextNode(todo.title));
    label.addEventListener('dblclick', todoDblClicked.bind(this, todo));

    var deleteLink = document.createElement('button');
    deleteLink.className = 'destroy';
    deleteLink.addEventListener( 'click', deleteButtonPressed.bind(this, todo));

    var divDisplay = document.createElement('div');
    divDisplay.className = 'view';
    divDisplay.appendChild(checkbox);
    divDisplay.appendChild(label);
    divDisplay.appendChild(deleteLink);

    var inputEditTodo = document.createElement('input');
    inputEditTodo.id = 'input_' + todo._id;
    inputEditTodo.className = 'edit';
    inputEditTodo.value = todo.title;
    inputEditTodo.addEventListener('keypress', todoKeyPressed.bind(this, todo));
    inputEditTodo.addEventListener('blur', todoBlurred.bind(this, todo));

    var li = document.createElement('li');
    li.id = 'li_' + todo._id;
    li.appendChild(divDisplay);
    li.appendChild(inputEditTodo);

    if (todo.completed) {
      li.className += 'complete';
      checkbox.checked = true;
    }

    return li;
  }
   
  
  function showDocumentSummary(row){
	var rowDisplay = document.createElement('div');
	rowDisplay.innerHTML = row._id+ " : "+row.screening_id + " - " + row.mnh_id;
	    
  	var li = document.createElement('li');
	li.id = 'li_' + row._id;
	li.appendChild(rowDisplay);
	return li;
  }

  function redrawTodosUI(rows) {
    var ul = document.getElementById('document-list');
    ul.innerHTML = '';
    rows.forEach(function(row) {
      ul.appendChild(showDocumentSummary(row.doc));
    });
  }

  function newTodoKeyPressHandler( event ) {
    if (completed.checked) {
      addForm(newTodoDom.value);
      newTodoDom.value = '';
    }
  }

  function addEventListeners() {
	save_form.addEventListener( 'click', addForm);
  }

  addEventListeners();
  showDocs();

  if (remoteCouch) {
    sync();
  }

})();
