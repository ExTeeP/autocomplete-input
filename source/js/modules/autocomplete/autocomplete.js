export class Autocomplete {
  constructor(container, callback) {
    this._container = container;
    this._callback = callback;
    this._inputElement = this._container.querySelector('input');
    this._autocompleteMenuElement = null;
    this._optionListElement = null;
    this._selectedListElement = null;
    this._selectedCountBtn = null;
    this._errorMessage = this._container.dataset.errorMsg;

    this._autocompleteData = []; // оригинальные данные
    this._autocompleteDataCopy = []; // массив для преобразования данных, содержит элементы кроме выбранных
    this._selectedItems = []; // массив выбранных элементов
    this._matchesItemData = []; // массив совпадений среди _autocompleteDataCopy

    this._hasMultiOptions = this._container.hasAttribute('data-multi-options');

    this._onInputHandler = this._debouceInput(this._onInputHandler.bind(this), 200);
    this._onClickHandler = this._onClickHandler.bind(this);
    this._onLoadDataHandler = this._onLoadDataHandler.bind(this);
    this._init();
  }

  _init() {
    this._callback();
    this._container.addEventListener('loadDataSuccess', this._onLoadDataHandler);
  }

  _onLoadDataHandler() {
    this._createMenu();
    if (this._hasMultiOptions) {
      this._updateSelectedCountBtn();
    }
    this._inputElement.addEventListener('input', this._onInputHandler);
    this._inputElement.addEventListener('keydown', this._onInputKeydown);
    this._container.addEventListener('click', this._onClickHandler);
  }

  _debouceInput(func, timeout, context = this) {
    let timer;
    return function () {
      context._autocompleteMenuElement.classList.remove('is-missing');
      context._container.classList.add('has-loader');

      const callback = () => {
        // eslint-disable-next-line
        func.apply(this, arguments)
      };

      context._optionListElement.innerHTML = ''; // обновляем элемент при новом вводе
      context._matchesItemData = []; // обновляем массив совпадений при новом вводе
      context._showOptionList(false);

      clearTimeout(timer);
      timer = setTimeout(callback, timeout);
    };
  }

  // общий контейнер выпадашки
  _createMenu() {
    this._autocompleteMenuElement = document.createElement('div');
    this._autocompleteMenuElement.classList.add('autocomplete-menu');
    this._createOptionList();

    if (this._hasMultiOptions) {
      this._inputElement.insertAdjacentHTML('afterend', this._createSelectCountBtn());
      this._createSelectedList();
    }

    this._createErrorMsg();
    this._container.append(this._autocompleteMenuElement);
  }

  // Список предлагаемых вариантов
  _createOptionList() {
    this._optionListElement = document.createElement('ul');
    this._optionListElement.classList.add('autocomplete-menu__list');
    this._optionListElement.classList.add('autocomplete-menu__list--options');
    this._autocompleteMenuElement.append(this._optionListElement);
  }

  // Список выбранных вариантов
  _createSelectedList() {
    this._selectedListElement = document.createElement('ul');
    this._selectedListElement.classList.add('autocomplete-menu__list');
    this._selectedListElement.classList.add('autocomplete-menu__list--selected');
    this._autocompleteMenuElement.append(this._selectedListElement);
  }

  // Создание элемента списка на основе данных
  _createOption(data, selectedOption = false) {
    const item = document.createElement('li');

    item.classList.add('autocomplete-menu__item');
    item.setAttribute('data-option-id', data.id);
    item.setAttribute('data-option-value', data.title);

    const labelHead = document.createElement('span');
    const labelValue = document.createElement('span');

    labelHead.classList.add('autocomplete-menu__head-label');
    labelValue.classList.add('autocomplete-menu__value');

    labelHead.textContent = 'улица';
    labelValue.textContent = data.title;

    item.append(labelHead);
    item.append(labelValue);

    if (!selectedOption) {
      item.setAttribute('tabIndex', '0');
      this._optionListElement.append(item);
    } else {
      item.insertAdjacentHTML('beforeend', this._createDeleteItemBtn());
      this._selectedListElement.append(item);
    }

    return item;
  }

  // Кнопка удаление выбранного варианта
  _createDeleteItemBtn() {
    return (`
      <button class="autocomplete-menu__btn-delete" type="button">
        <span class="visually-hidden">Удалить вариант</span>
        <svg class="btn__icon" width="16" height="16" aria-hidden="true">
          <use xlink:href="#icon-close"></use>
        </svg>
      </button>
    `);
  }

  // Кнопка счетчик на инпуте
  _createSelectCountBtn() {
    return (`
      <button class="btn custom-input__selected-btn" type="button">
        <span class="btn__text counter">777</span>
      </button>
    `);
  }

  // Сообщение о ошибке поиска совпадений
  _createErrorMsg() {
    const messageStr = this._errorMessage ? this._errorMessage : 'Похожих запросов не найдено.';
    if (this._errorMessage) {
      this._container.removeAttribute('data-error-msg');
    }
    const message = document.createElement('p');
    message.classList.add('autocomplete-menu__error');
    message.textContent = messageStr;
    this._autocompleteMenuElement.append(message);
  }

  // Обновление кнопки счетчика по которой вызывается список выбранного
  _updateSelectedCountBtn() {
    this._selectedCountBtn = this._container.querySelector('.custom-input__selected-btn');

    if (this._selectedItems.length === 0) {
      this._container.classList.remove('has-counter-btn');
    } else {
      this._container.classList.add('has-counter-btn');
    }
    const countElement = this._selectedCountBtn.querySelector('.counter');
    countElement.textContent = this._selectedItems.length;
  }

  // Поиск совпадений по вводу в массиве данных
  _searchInData(what = '', where = '') {
    return where.toLowerCase().search(what.toLowerCase());
  }

  // Показ окна с предлагаемыми вариантами
  _showOptionList(active = true) {
    if (!active) {
      this._autocompleteMenuElement.classList.remove('is-active-options');
      return;
    }
    this._autocompleteMenuElement.classList.add('is-active-options');
    this._container.classList.remove('has-loader');
    this._autocompleteMenuElement.classList.remove('is-missing');
  }

  // Ввод осуществляется через debounce 200ms
  _onInputHandler() {
    if (!this._inputElement.value) {
      this._showOptionList(false);
      this._autocompleteMenuElement.classList.remove('is-missing');
      this._container.classList.remove('has-loader');
      return;
    }

    this._optionListElement.innerHTML = ''; // обновляем элемент при новом вводе
    this._matchesItemData = []; // обновляем массив совпадений при новом вводе

    this._autocompleteDataCopy.forEach((dataItem) => {
      let matches = this._searchInData(this._inputElement.value, dataItem.title);

      if (matches === -1) {
        this._autocompleteMenuElement.classList.add('is-missing');
        this._container.classList.remove('has-loader');
        return;
      }

      this._matchesItemData.push(dataItem);
      this._createOption(dataItem);
    });

    if (this._matchesItemData.length > 0) {
      this._showOptionList();
    } else {
      this._showOptionList(false);
    }
  }

  _onClickHandler(evt) {
    const container = evt.target.closest('[data-autocomplete]');

    if (container) {
      const item = evt.target.closest('.autocomplete-menu__item');
      const deleteBtnSelectedItem = evt.target.closest('.autocomplete-menu__btn-delete');
      const selectedCountBtn = evt.target.closest('.custom-input__selected-btn');

      // при мультивставке выбранных элементов в отдельный список
      if (this._hasMultiOptions) {
        if (item) {
          // клик по элементу списка предлагаемых вариантов
          if (item.closest('.autocomplete-menu__list--options')) {
            this._matchesItemData.forEach((dataItem) => {
              if (Number(dataItem.id) === Number(item.dataset.optionId)) {
                this._selectedItems.push(dataItem);
                this._createOption(dataItem, true);
                this._autocompleteDataCopy = this._autocompleteDataCopy.filter((it) => it.id !== dataItem.id);
                this._updateSelectedCountBtn();
              }
            });

            this._inputElement.value = '';
          }

          // клик по элементу списка выбранных вариантов
          if (item.closest('.autocomplete-menu__list--selected')) {
            // клик по кнопке удаления варианта
            if (deleteBtnSelectedItem) {
              const itemToDelete = evt.target.closest('.autocomplete-menu__item');

              this._selectedItems.forEach((dataItem) => {
                if (Number(dataItem.id) === Number(item.dataset.optionId)) {
                  this._autocompleteDataCopy.push(dataItem);
                  this._selectedItems = this._selectedItems.filter((it) => it.id !== dataItem.id);
                  itemToDelete.remove();
                  this._updateSelectedCountBtn();
                }
              });

              if (this._selectedItems.length === 0) {
                this._autocompleteMenuElement.classList.remove('is-active-selected');
              }
            }
          }
        }

        // клик по кнопке счетчику для показа выбранных элементов
        if (selectedCountBtn) {
          if (this._autocompleteMenuElement.closest('.is-active-options')) {
            this._autocompleteMenuElement.classList.remove('is-active-options');
          }
          this._autocompleteMenuElement.classList.toggle('is-active-selected');
        }
      } else {
        if (item) {
          this._inputElement.value = item.dataset.optionValue;
          this._autocompleteMenuElement.classList.remove('is-active-options');
        }
      }
    }
  }

  reInit() {
    this._autocompleteMenuElement.remove();
    this._init();
  }
}
