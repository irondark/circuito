const modals = (() => {
    const _openAndCloseMixin = (instance) => ({
      open: () => {
        instance.open();
      },
      close: () => {
        instance.close();
      },
    });
  
    const _throwInvalidButtonType = (btn) => {
      throw new Error(`Invalid button type "${btn}"`);
    }
  
    const NewFile = () => {
      const newFileModal = document.querySelector('#new-file-modal');
      const btnYes = newFileModal.querySelector('#btn-yes');
      const btnNo = newFileModal.querySelector('#btn-no');
      const instance = M.Modal.init(newFileModal);
  
      function onClick(btn, callback) {
        if (btn === 'yes') {
          btnYes.addEventListener('click', callback);
        } else if (btn === 'no') {
          btnNo.addEventListener('click', callback);
        } else {
          _throwInvalidButtonType(btn);
        }
      }
  
      return {
        ...{onClick},
        ..._openAndCloseMixin(instance)
      };
    }
  
    const SaveFile = () => {
      const modalSave = document.querySelector('#modal-save');
      const buttons = {
        save: modalSave.querySelector('#btn-save'),
        export: modalSave.querySelector('#btn-export'),
      };
      let formatSelectorWrapper = modalSave.querySelector('#format-selector-wrapper');
      let formatSelector = formatSelectorWrapper.querySelector('#format-selector');
      let filenameInput = modalSave.querySelector('#filename-input');
      let instance = M.Modal.init(modalSave, {
        onOpenEnd: (evt) => {
          filenameInput.focus();
          filenameInput.select();
        },
        onCloseEnd: (evt) => {
          hideButton('save');
          hideButton('export');
          formatSelectorWrapper.classList.add('hide');
        }
      });
      let mixin = _openAndCloseMixin(instance);
  
      function cls(action, className, btn) {
        buttons[btn].classList[action](className);
      }
  
      function hideButton(btn) {
        cls('add', 'hide', btn);
      }
  
      function showButton(btn) {
        cls('remove', 'hide', btn);
      }
  
      function hideFormatSelector() {
        formatSelectorWrapper.classList.add('hide');
      }
  
      function showFormatSelector() {
        formatSelectorWrapper.classList.remove('hide');
      }
  
      function getSelectedFormat() {
        return formatSelector.value;
      }
  
      function onClick(btn, callback, options) {
        buttons[btn].addEventListener('click', callback, options);
      }
  
      function getFilename() {
        return filenameInput.value;
      }
  
      mixin.openForSave = () => {
        showButton('save');
        mixin.open();
      };
  
      mixin.openForExport = () => {
        showFormatSelector();
        hideButton('save')
        showButton('export')
        mixin.open();
      };
  
      return {
        ...{
          hideButton,
          showButton,
          onClick,
          getFilename,
          showFormatSelector,
          hideFormatSelector,
          getSelectedFormat,
        },
        ...mixin,
      };
    }
  
    return {
      NewFile,
      SaveFile,
    };
  
  })();
  