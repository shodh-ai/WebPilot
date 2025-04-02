import { useRouter } from 'next/navigation';

type ElementSelector = {
  elementName?: string;
  elementType?: string;
  elementId?: string;
  elementClass?: string;
  text?: string;
};

type NavigationAction = {
  route: string;
};

type InputAction = {
  selector: ElementSelector;
  value: string;
};

type ClickAction = {
  selector: ElementSelector;
};

export const findElement = (selector: ElementSelector): Element | null => {
  if (!selector || Object.keys(selector).length === 0) {
    console.error('Empty or invalid selector provided');
    return null;
  }
  
  let element: Element | null = null;
  
  console.log('Finding element with selector:', selector);
  
  if (selector.elementId) {
    element = document.getElementById(selector.elementId);
    if (element) {
      console.log('Found element by ID:', selector.elementId);
      return element;
    }
  }
  
  if (selector.elementName) {
    const elements = document.querySelectorAll(`[name="${selector.elementName}"]`);
    if (elements.length > 0) {
      console.log('Found element by name:', selector.elementName);
      return elements[0];
    }
  }
  
  if (selector.elementType?.toLowerCase() === 'input' && selector.text) {
    const commonFields: {[key: string]: string[]} = {
      'email': ['email', 'userEmail', 'user-email', 'mail'],
      'password': ['password', 'userPassword', 'user-password', 'pwd'],
      'name': ['name', 'fullName', 'userName', 'user-name'],
      'title': ['title', 'postTitle', 'subject', 'heading'],
      'department': ['department', 'dept', 'team', 'category'],
      'message': ['message', 'content', 'body', 'text', 'description']
    };
    
    let possibleNames: string[] = [];
    
    for (const [category, fieldNames] of Object.entries(commonFields)) {
      if (selector.text.toLowerCase().includes(category)) {
        possibleNames = fieldNames;
        break;
      }
    }
    
    for (const name of possibleNames) {
      const namedElements = document.querySelectorAll(`[name="${name}"], [id="${name}"], [placeholder*="${name}"], [aria-label*="${name}"]`);
      if (namedElements.length > 0) {
        console.log(`Found input by common field name: ${name}`);
        return namedElements[0];
      }
    }
  }
  
  if (selector.elementClass) {
    const elements = document.getElementsByClassName(selector.elementClass);
    if (elements.length > 0) {
      console.log('Found element by class:', selector.elementClass);
      return elements[0];
    }
  }
  
  if ((selector.elementType?.toLowerCase() === 'input' || selector.elementType?.toLowerCase() === 'textarea' || selector.elementType?.toLowerCase() === 'select') && selector.text) {
    const labels = Array.from(document.querySelectorAll('label'));
    for (const label of labels) {
      if (label.textContent?.toLowerCase().includes(selector.text.toLowerCase())) {
        const forAttr = label.getAttribute('for');
        if (forAttr) {
          const input = document.getElementById(forAttr);
          if (input) {
            console.log('Found form field through label:', selector.text);
            return input;
          }
        }
        
        const innerInput = label.querySelector(selector.elementType) || 
                          label.closest('div, form')?.querySelector(selector.elementType);
        if (innerInput) {
          console.log('Found input near label with text:', selector.text);
          return innerInput;
        }
      }
    }
    
    const formFields = Array.from(document.querySelectorAll(selector.elementType));
    for (const field of formFields) {
      const placeholder = field.getAttribute('placeholder')?.toLowerCase() || '';
      const name = field.getAttribute('name')?.toLowerCase() || '';
      const id = field.getAttribute('id')?.toLowerCase() || '';
      const ariaLabel = field.getAttribute('aria-label')?.toLowerCase() || '';
      
      if (placeholder.includes(selector.text.toLowerCase()) || 
          name.includes(selector.text.toLowerCase()) ||
          id.includes(selector.text.toLowerCase()) ||
          ariaLabel.includes(selector.text.toLowerCase())) {
        console.log('Found form field by attribute containing:', selector.text);
        return field;
      }
      
      const parentDiv = field.closest('div');
      if (parentDiv && parentDiv.textContent?.toLowerCase().includes(selector.text.toLowerCase())) {
        console.log('Found form field through parent div text:', selector.text);
        return field;
      }
    }
  }
  
  if ((selector.elementType?.toLowerCase() === 'button' || selector.elementType?.toLowerCase() === 'a') && selector.text) {
    const buttons = Array.from(document.querySelectorAll(selector.elementType));
    for (const btn of buttons) {
      if (btn.textContent?.toLowerCase().includes(selector.text.toLowerCase())) {
        console.log('Found button/link with text:', selector.text);
        return btn;
      }
    }
    
    const interactiveElements = Array.from(document.querySelectorAll(
      'button, a, div[role="button"], [class*="btn"], input[type="submit"], input[type="button"]'
    ));
    
    for (const el of interactiveElements) {
      const elementText = el.textContent?.toLowerCase() || '';
      const searchText = selector.text.toLowerCase();
      if (elementText.includes(searchText)) {
        console.log('Found interactive element by text content:', selector.text);
        return el;
      }
    }
    
    const allElements = Array.from(document.querySelectorAll('*'));
    for (const el of allElements) {
      if (el.childNodes.length === 0 || 
         (el.childNodes.length === 1 && el.firstChild?.nodeType === Node.TEXT_NODE)) {
        const elementText = el.textContent?.toLowerCase() || '';
        const searchText = selector.text.toLowerCase();
        if (elementText.includes(searchText)) {
          console.log('Found element by exact text match:', selector.text);
          return el;
        }
      }
    }
    
    for (const el of allElements) {
      const elementText = el.textContent?.toLowerCase() || '';
      const searchText = selector.text.toLowerCase();
      if (elementText.includes(searchText)) {
        console.log('Found element containing text (broad search):', selector.text);
        return el;
      }
    }
  }
  
  if (selector.elementType) {
    const elements = document.getElementsByTagName(selector.elementType);
    if (elements.length > 0) {
      console.log('Found element by type only:', selector.elementType);
      return elements[0];
    }
  }
  
  console.log('Could not find any element matching selector:', selector);
  return null;
};

export const navigateTo = async (params: NavigationAction): Promise<string> => {
  try {
    const { route } = params;
    
    let finalRoute = route;
    
    if (route === 'logout' || route.toLowerCase().includes('logout')) {
      console.log('Handling logout request');
      
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      document.cookie = "token=; path=/; max-age=0";
      
      finalRoute = '/login';
    }
    
    const newPath = finalRoute.startsWith('/') ? finalRoute : `/${finalRoute}`;
    window.location.href = newPath;
    
    return `Successfully navigated to ${finalRoute}`;
  } catch (error) {
    console.error('Navigation error:', error);
    return `Failed to navigate: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};

export const fillInput = async (params: InputAction): Promise<string> => {
  try {
    const { selector, value } = params;
    
    if (!selector || typeof selector !== 'object') {
      console.error('Invalid selector: must be a non-null object');
      return `Error: Invalid selector provided - must be a non-null object`;
    }
    
    if (Object.keys(selector).length === 0) {
      console.error('Empty selector object provided');
      return `Error: Empty selector object provided. Please specify at least one property (elementType, elementId, elementName, elementClass, or text)`;
    }
    
    if (!selector.elementType && !selector.elementId && !selector.elementName && !selector.elementClass && !selector.text) {
      console.error('Insufficient selector properties:', selector);
      return `Error: Insufficient selector properties. Need at least one of: elementType, elementId, elementName, elementClass, or text`;
    }
    
    console.log('Looking for input element with selector:', selector);
    
    if (!selector.elementType && (selector.text || selector.elementId || selector.elementName || selector.elementClass)) {
      console.log('Adding default elementType "input" to selector');
      selector.elementType = 'input';
    }
    
    const element = findElement(selector) as HTMLInputElement | null;
    
    if (!element) {
      console.error('Input element not found with selector:', selector);
      
      if (selector.text) {
        const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
        for (const input of inputs) {
          const placeholder = input.getAttribute('placeholder')?.toLowerCase() || '';
          const name = input.getAttribute('name')?.toLowerCase() || '';
          const id = input.getAttribute('id')?.toLowerCase() || '';
          const nearbyLabel = input.closest('div')?.querySelector('label')?.textContent?.toLowerCase() || '';
          
          if (placeholder.includes(selector.text.toLowerCase()) || 
              name.includes(selector.text.toLowerCase()) ||
              id.includes(selector.text.toLowerCase()) ||
              nearbyLabel.includes(selector.text.toLowerCase())) {
            console.log('Found input using fallback broader search:', input);
            
            try {
              (input as HTMLInputElement).value = value;
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
              
              (input as HTMLInputElement).focus();
              setTimeout(() => {
                input.dispatchEvent(new Event('blur', { bubbles: true }));
              }, 100);
              
              return `Successfully filled input with "${value}" using fallback search`;
            } catch (err) {
              console.error('Error setting input value:', err);
            }
          }
        }
      }
      
      return `Couldn't find the input element with the provided selector. Please try a different or more specific selector.`;
    }
    
    console.log('Found element:', element.tagName, element);
    
    const validInputTags = ['INPUT', 'TEXTAREA', 'SELECT'];
    if (!validInputTags.includes(element.tagName)) {
      let inputElement = null;
      
      const innerInputs = element.querySelectorAll('input, textarea, select');
      if (innerInputs && innerInputs.length > 0) {
        inputElement = innerInputs[0] as HTMLInputElement;
      } 
      else if (element.tagName === 'LABEL') {
        const forAttr = element.getAttribute('for');
        if (forAttr) {
          inputElement = document.getElementById(forAttr) as HTMLInputElement;
        }
      }
      else {
        const parentContainer = element.closest('div, form, fieldset');
        if (parentContainer) {
          const nearbyInputs = parentContainer.querySelectorAll('input, textarea, select');
          if (nearbyInputs && nearbyInputs.length > 0) {
            inputElement = nearbyInputs[0] as HTMLInputElement;
          }
        }
      }
      
      if (inputElement) {
        console.log('Using nearby input element instead:', inputElement);
        
        try {
          inputElement.value = value;
          
          inputElement.focus();
          
          const inputEvent = new Event('input', { bubbles: true });
          inputElement.dispatchEvent(inputEvent);
          
          const changeEvent = new Event('change', { bubbles: true });
          inputElement.dispatchEvent(changeEvent);
          
          setTimeout(() => {
            const blurEvent = new Event('blur', { bubbles: true });
            inputElement.dispatchEvent(blurEvent);
          }, 100);
          
          return `Successfully filled input with: "${value}"`;
        } catch (err) {
          console.error('Error setting input value:', err);
          return `Error while setting input value: ${err instanceof Error ? err.message : 'Unknown error'}`;
        }
      }
      
      console.error('Found element is not an input and no nearby input found:', element.tagName);
      return `Found element ${element.tagName} is not an input, and couldn't find a related input element.`;
    }
    
    if (element.tagName === 'SELECT') {
      try {
        const selectElement = element as unknown as HTMLSelectElement;
        
        let optionFound = false;
        for (let i = 0; i < selectElement.options.length; i++) {
          if (selectElement.options[i].text.toLowerCase() === value.toLowerCase() || 
              selectElement.options[i].value.toLowerCase() === value.toLowerCase()) {
            selectElement.selectedIndex = i;
            optionFound = true;
            break;
          }
        }
        
        if (!optionFound) {
          selectElement.value = value;
        }
        
        selectElement.dispatchEvent(new Event('change', { bubbles: true }));
        return `Successfully selected option: "${value}"`;
      } catch (err) {
        console.error('Error setting select value:', err);
        return `Error while setting select value: ${err instanceof Error ? err.message : 'Unknown error'}`;
      }
    }
    
    try {
      element.value = value;
      element.focus();
      
      try {
        element.dispatchEvent(new Event('input', { bubbles: true }));
      } catch (e) {
        console.warn('Error dispatching input event:', e);
      }
      
      try {
        element.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (e) {
        console.warn('Error dispatching change event:', e);
      }
      
      try {
        element.dispatchEvent(new Event('blur', { bubbles: true }));
      } catch (e) {
        console.warn('Error dispatching blur event:', e);
      }
      
      return `Successfully filled input with: "${value}"`;
    } catch (err) {
      console.error('Error setting input value:', err);
      return `Error while setting input value: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }
  } catch (error) {
    console.error('Fill input error:', error);
    return `Failed to fill input: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};

export const clickElement = async (params: ClickAction): Promise<string> => {
  try {
    const { selector } = params;
    
    if (!selector || typeof selector !== 'object') {
      console.error('Invalid selector: must be a non-null object');
      return `Error: Invalid selector provided - must be a non-null object`;
    }
    
    if (Object.keys(selector).length === 0) {
      console.error('Empty selector object provided');
      return `Error: Empty selector object provided. Please specify at least one property (elementType, elementId, elementName, elementClass, or text)`;
    }
    
    console.log('Attempting to click element with selector:', selector);
    
    if (selector.text?.toLowerCase().includes('logout')) {
      const logoutButtons = document.querySelectorAll('button, [role="button"]');
      for (let i = 0; i < logoutButtons.length; i++) {
        const btnText = logoutButtons[i].textContent?.toLowerCase() || '';
        if (btnText.includes('logout')) {
          console.log('Found logout button:', logoutButtons[i]);
          try {
            (logoutButtons[i] as HTMLElement).click();
            return `Successfully clicked the logout button`;
          } catch (e) {
            console.error('Error clicking logout button:', e);
          }
        }
      }
      
      const logoutIcons = document.querySelectorAll('[class*="logout"]');
      if (logoutIcons.length > 0) {
        console.log('Found possible logout button via icon search:', logoutIcons[0]);
        try {
          (logoutIcons[0] as HTMLElement).click();
          return `Clicked what appears to be a logout button`;
        } catch (e) {
          console.error('Error clicking logout icon:', e);
        }
      }
    }
    
    if (selector.text?.toLowerCase().includes('add') && 
        (selector.text?.toLowerCase().includes('post') || selector.text?.toLowerCase().includes('new'))) {
      const addButtons = document.querySelectorAll('button, a, div[role="button"], [class*="btn"]');
      for (let i = 0; i < addButtons.length; i++) {
        const btnText = addButtons[i].textContent?.toLowerCase() || '';
        const hasAddText = btnText.includes('add') || btnText.includes('new') || btnText.includes('create');
        const hasPostText = btnText.includes('post');
        
        if (hasAddText && hasPostText) {
          console.log('Found add post button via enhanced search:', addButtons[i]);
          try {
            (addButtons[i] as HTMLElement).click();
            return `Successfully clicked the add post button`;
          } catch (e) {
            console.error('Error clicking add post button:', e);
          }
        }
      }
      
      const plusButtons = document.querySelectorAll('[class*="plus"], [class*="add"], svg[class*="plus"], svg[class*="add"]');
      if (plusButtons.length > 0) {
        console.log('Found possible add button via icon search:', plusButtons[0]);
        try {
          (plusButtons[0] as HTMLElement).click();
          return `Clicked what appears to be an add button`;
        } catch (e) {
          console.error('Error clicking add button:', e);
        }
      }
    }
    
    const element = findElement(selector) as HTMLElement;
    
    if (!element) {
      console.error('Element not found with selector:', selector);
      
      if (selector.text?.toLowerCase().includes('post')) {
        return `Couldn't find the button to create a post. I'll try to help you locate it. Please let me know if you see an "Add" or "New" button somewhere on the page.`;
      }
      
      return `Couldn't find the element to click. Please try describing it differently.`;
    }
    
    console.log('Found element to click:', element);
    
    try {
      element.click();
      return `Successfully clicked the element`;
    } catch (e) {
      console.error('Error clicking element:', e);
      
      try {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        element.dispatchEvent(clickEvent);
        return `Successfully clicked the element using event dispatch`;
      } catch (eventError) {
        console.error('Error dispatching click event:', eventError);
        return `Failed to click element: ${eventError instanceof Error ? eventError.message : 'Unknown error'}`;
      }
    }
  } catch (error) {
    console.error('Click error:', error);
    return `Failed to click element: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};

export const submitForm = async (params: ClickAction): Promise<string> => {
  try {
    const { selector } = params;
    
    if (!selector || typeof selector !== 'object') {
      console.error('Invalid selector: must be a non-null object');
      return `Error: Invalid selector provided - must be a non-null object`;
    }
    
    if (Object.keys(selector).length === 0) {
      console.error('Empty selector object provided for form');
      return `Error: Empty selector object provided. Please specify at least one property to identify the form.`;
    }
    
    console.log('Attempting to submit form with selector:', selector);
    
    if (!selector.elementType) {
      selector.elementType = 'form';
    }
    
    const formElement = findElement(selector) as HTMLFormElement;
    
    if (formElement) {
      console.log('Found form element:', formElement);
      
      if (formElement.tagName.toLowerCase() === 'form') {
        try {
          formElement.submit();
          console.log('Used native form.submit()');
          return `Successfully submitted the form using native submit method`;
        } catch (submitError) {
          console.warn('Native submit failed, trying event dispatch:', submitError);
          
          try {
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            const wasDispatched = formElement.dispatchEvent(submitEvent);
            
            if (!wasDispatched) {
              console.log('Submit event was cancelled, looking for submit button');
            }
            
            // Find and click submit button as a final fallback
            const submitBtn = formElement.querySelector('button[type="submit"], input[type="submit"], button:not([type]), .submit-btn, [class*="submit"]');
            if (submitBtn) {
              console.log('Clicking submit button within form');
              try {
                (submitBtn as HTMLElement).click();
                return `Submitted form by clicking the submit button`;
              } catch (clickError) {
                console.error('Error clicking submit button:', clickError);
              }
            }
            
            return `Attempted to submit form with event dispatch`;
          } catch (eventError) {
            console.error('Error dispatching submit event:', eventError);
          }
        }
      } else {
        console.warn('Found element is not a form, will look for forms or submit buttons');
      }
    }
        
    if (selector.text) {
      const possibleContainers = Array.from(document.querySelectorAll('div, section, main, article'));
      for (const container of possibleContainers) {
        if (container.textContent?.toLowerCase().includes(selector.text.toLowerCase())) {
          const formInContainer = container.querySelector('form');
          if (formInContainer) {
            console.log('Found form in container with matching text');
            try {
              (formInContainer as HTMLFormElement).submit();
              return `Submitted form found in container with matching text`;
            } catch (e) {
              try {
                const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                formInContainer.dispatchEvent(submitEvent);
                return `Dispatched submit event to form found in container with matching text`;
              } catch (eventError) {
                console.error('Error dispatching submit event:', eventError);
              }
            }
          }
          
          const submitButton = container.querySelector('button[type="submit"], input[type="submit"], button, .submit-btn, [class*="submit"]');
          if (submitButton) {
            console.log('Found submit button in container with matching text');
            try {
              (submitButton as HTMLElement).click();
              return `Clicked submit button in container with matching text`;
            } catch (clickError) {
              console.error('Error clicking submit button:', clickError);
            }
          }
        }
      }
    }
    
    const forms = document.getElementsByTagName('form');
    if (forms.length > 0) {
      console.log('Found form using fallback method');
      try {
        forms[0].submit();
        return `Successfully submitted the form using fallback method`;
      } catch (e) {
        try {
          forms[0].dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          return `Dispatched submit event to form using fallback method`;
        } catch (eventError) {
          console.error('Error dispatching submit event:', eventError);
        }
      }
    }
    
    // First look for actual submit buttons
    const submitButtons = Array.from(document.querySelectorAll('button[type="submit"], input[type="submit"]'));
    
    // Then look for buttons with text containing "submit", "save", "send", etc.
    const allButtons = Array.from(document.querySelectorAll('button, [role="button"], .btn, .button'));
    const textSubmitButtons = allButtons.filter(btn => {
      const btnText = btn.textContent?.toLowerCase() || '';
      return btnText.includes('submit') || btnText.includes('save') || 
             btnText.includes('send') || btnText.includes('create') ||
             btnText.includes('add') || btnText.includes('post');
    });
    
    // Create a priority list with exact matches first
    const allSubmitButtonsByPriority = [
      ...submitButtons,
      ...textSubmitButtons,
      ...Array.from(document.querySelectorAll('.submit, .save, [class*="submit"], [class*="save"], [class*="create"]'))
    ];
    
    if (allSubmitButtonsByPriority.length > 0) {
      console.log('Clicking submit button as fallback');
      
      try {
        (allSubmitButtonsByPriority[0] as HTMLElement).click();
        
        setTimeout(() => {
          try {
            (allSubmitButtonsByPriority[0] as HTMLElement).click();
          } catch (e) {
          }
        }, 100);
        
        return `Clicked the submit button as a fallback method`;
      } catch (clickError) {
        console.error('Error clicking submit button:', clickError);
        return `Attempted to click submit button but encountered an error: ${clickError instanceof Error ? clickError.message : 'Unknown error'}`;
      }
    }
    
    console.error('Form element not found with any method');
    return `Couldn't find a form or submit button. Please try a different approach or provide more specific details about the form.`;
  } catch (error) {
    console.error('Form submission error:', error);
    return `Failed to submit form: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};