import {Autocomplete} from './autocomplete';

let autocomplete = [];

const onDocumentHandler = (evt) => {
  const activeOptionList = document.querySelector('[data-autocomplete] .is-active-options');
  const activeSelectedList = document.querySelector('[data-autocomplete] .is-active-selected');
  const activeArroreMessage = document.querySelector('[data-autocomplete] .is-missing');
  const counterBtn = evt.target.closest('.custom-input__selected-btn');
  const deleteBtnSelectedItem = evt.target.closest('.autocomplete-menu__btn-delete');

  if (counterBtn) {
    return;
  }

  if (deleteBtnSelectedItem) {
    return;
  }

  if (activeOptionList) {
    activeOptionList.classList.remove('is-active-options');
  }

  if (activeSelectedList) {
    activeSelectedList.classList.remove('is-active-selected');
  }

  if (activeArroreMessage) {
    activeArroreMessage.classList.remove('is-missing');
  }
};

// Пример получения локального json через fetch, вся работа внутри, происходит с копией массива данных _autocompleteDataCopy
// при завершении обязательно должно быть вызвано событие loadData, для рендера элементов
const getData = (context) => {
  fetch('data/posts.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error(res.status);
        }
        return res.json();
      })
      .then((data) => {
        context._autocompleteData = data;
        context._autocompleteDataCopy = context._autocompleteData.slice();
        context._container.dispatchEvent(new CustomEvent('loadDataSuccess'));
        return data;
      });
};

// Добавьте свою коллбек-функцию и аттрибут (data-autocomplete-callback="custom") с её именем из объекта ниже, для элемента с data-autocomplete
// так же через коллбек можно изменить сообщение об ошибке поиска, просто передайте строку с ошибкой в this._errorMessage
const callbacks = {
  base() {
    getData(this);
  },
  custom() {
    // добавить функцию получения данных
    console.log('Кастомный коллбек');
  },
};

// чтобы подкорректировать верстку элементов списков отредактируйте _createOption() в autocomplete.js
const initAutocomplete = () => {
  const autocompleteElements = [...document.querySelectorAll('[data-autocomplete]')];

  if (!autocompleteElements.length) {
    return;
  }

  const autocompleteEntities = autocompleteElements.map((it) => {
    let callback = it.dataset.autocompleteCallback;

    if (!callback) {
      callback = 'base';
    }

    return new Autocomplete(it, callbacks[callback]);
  });
  autocompleteEntities.forEach((it) => autocomplete.push(it));
  document.addEventListener('click', onDocumentHandler);

  window.autocomplete = autocomplete;
};


export {initAutocomplete};
