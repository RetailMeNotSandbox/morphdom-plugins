Morphdom only accepts a single config object when updating the DOM. This makes it difficult to encapsulate a morphdom config specific to a single feature. To solve this problem, we created the `@retailmenot/morphdom-plugins` module, which can stitch together multiple morphdom configurations into a single morphdom configuration.

There are a few pieces of functionality we've isolated as it relates to morphdom, and we've encapsulated them into different plugins which we combine using `applyMorphdomPlugins`.

{{TOC}}

# Demo App

This repo contains a demo application that utilizes the plugins contained within this repo. To run:

```bash
cd example
npm install
npm run start
```

And visit [http://www.localhost:3000](http://www.localhost:3000)

# applyMorphdomPlugins

`applyMorphdomPlugins` lets you stitch multiple morphdom configs together into a single one. Think of this method as the analog to redux's `applyMiddleware`.

`applyMorphdomPlugins` wraps each method in a morphdom config with another method that will invoke a plugin's code when appropriate.

For morphdom methods that return `false`, the code for plugins that follow later in the plugins list will not be executed. This is analogous to swallowing an action in a piece of redux middleware, or choosing not to call `next()` in express middleware.

**Note:** Where morphdom allows you to return either a node or `false`, `applyMorphdomPlugins` will enforce that you return either `true`, `false`, or a dom node. The extra strictness is required so that the middleware can determine if it should run the next plugin.

## Usage

```js
var morphdomPlugins = require('@retailmenot/morphdom-plugins');
var app = document.getElementById( '#app' );
var html = '<div id="app" class="app"> ... </div>';
var plugins = [
  morphdomPlugins.inputPersistence.plugin(),
  morphdomPlugins.cssTransitionGroup.plugin(),
  morphdomPlugins.transitionElementMovement.plugin(),
  morphdomPlugins.transitionHeight.plugin(),
  morphdomPlugins.inputPersistence.plugin()
];
morphdom( app, html, morphdomPlugins.applyMorphdomPlugins( plugins, {
  // morphdom config
} ) );
```

# Plugins

Plugins are functions that return morphdom configurations. Each plugin/configuration encapsulates a set of functionality related to re-rendering with morphdom. The existing plugins are described below.

## cssTransitionGroup

`cssTransitionGroup` enables you to easily transition DOM elements when they are being added or deleted from your DOM tree. This plugin was inspired by React's [`CSSTransitionGroup`](https://facebook.github.io/react/docs/animation.html). You should read those docs to become familiar with the paradigm.

### Differences from CSSTransitionGroup

The primary difference is that the `transition-enter-timeout` and `transition-leave-timeout` options have been renamed to `transition-enter-duration` and `transition-leave-duration`.

It also does not support `CSSTransitionGroup`'s concept of `transitionAppear`.

Also, this plugin introduces the concept of `transition-enter-delay` and `transition-leave-delay` options that delay the start of the corresponding transitions. Their values are optional, and are used to delay the application of the `-active` class for the animation.

### Usage

```html
<div
  class="my-alert"
  data-transition-name="example"
  data-transition-enter-duration="2000"
  data-transition-leave-delay="500"
  data-transition-leave-duration="500"
>
    ...
</div>
```

```css
.my-alert.example-enter {
  transition: opacity 500ms ease-out;
  opacity: 0;
}
.my-alert.example-enter-active {
  opacity: 1;
}
.my-alert.example-leave {
  opacity: 1;
  transition: opacity 500ms ease-out;
}
.my-alert.example-leave-active {
  opacity: 0;
}
```

You can disable just the entry or the leave animations as follows:

```html
<div
  class="my-alert"
  data-transition-name="example"
  data-transition-enter="false"
  data-transition-leave="false"
>
    ...
</div>
```

Disable both by omitting the `data-transition-name` attribute.

## transitionElementMovement

`transitionElementMovement` enables you to transition an element that has moved from one position on the page to another, or changed height or width across calls to morphdom. Its implementation was heavily influenced by [react-flip-move](https://medium.com/developers-writing/animating-the-unanimatable-1346a5aab3cd).

### Usage

```html
<div class="my-element"
  data-transition-motion="true"
  data-transition-motion-duration="200"
  data-transition-motion-class="transition-motion"
> ... </div>
```

```css
.my-element.transition-motion {
  transition: transform 500ms ease;
}
```

That's it. The plugin will take care of the rest.

**Note:** `data-transition-motion-class` is optional. If not provided, it defaults to `transition-motion`. This class will be present on the node when its position should be transitioned. You should add a transition rule for the transform property when the `data-transition-motion-class` class is present on your node.

### Sass mixin

`morphdom-plugins` includes a sass mixin to help you easily generate compatible CSS rules for dom nodes relying on the `transitionElementMovement` plugin.

```sass
@import 'node_modules/morphdom-plugins/sass-mixins/transition-element-movement/index'
.transition-movement {
  @include transitionElementMovement(
    "transition-motion",
    500ms ease
  );
}
```

```css
  .transition-movement.transition-motion {
    transition: transform 500ms ease,
      height 500ms ease,
      width 500ms ease;
  }
```

## transitionHeight

`transitionHeight` enables you to transition the expanding or collapsing of an element. It takes care of setting the `max-height` on the element to match the height of its content.

This plugin is only necessary because browsers can't transition from a `max-height: 0` to a `max-height: auto`, which is what you need to do if the content being revealed is of variable height.

### Usage

```html
<div
  class="my-element{{#if isCollapsed}} collapsed{{/if}}"
  data-transition-height="true"
  data-transition-height-collapsed-class="collapsed"
>
  <div data-transition-height-target="true">
    ...
  </div>
</div>
```

```css
.my-element {
  transition: max-height 250ms ease-out;
  overflow: hidden;
}
.my-element.collapsed {
  max-height: 0;
}
```

**Note:** `data-transition-height-collapsed-class` is optional. If omitted, its value will default to `is-collapsed`. The presence or absence of this class will be used to determine when to update the height of the element.

**Note:** `transitionHeight` will throw if an element with `data-transition-height="true"` does not have a single child that has the `data-transition-height-target="true"` attribute.

### Transitioning new node's height

The approach for transitioning newly added nodes is a little different, so opting into this functionality is handled differently.

#### Usage

```html
<div
  class="my-element"
  data-transition-height-on-added="true"
  data-transition-height-on-added-delay="1500"
>
  <div data-transition-height-target="true">
    ...
  </div>
</div>
```

```css
.my-element {
  transition: max-height 250ms ease-out;
  overflow: hidden;
  max-height: 0;
}
```

### Updating the height on window resize

This component also exports a `resizeHandler` to update the heights of elements on your page when the page size changes.

```bash
npm install --save-dev lodash.throttle
```

```
var throttle = require('lodash.throttle');
var morphdomPlugins = require('@retailmenot/morphdom-plugins');
throttle(morphdomPlugins.morphdomTransitionHeight.resizeHandler, 150);
```

### Sass mixin

`morphdom-plugins` includes a sass mixin to help you easily generate compatible CSS rules for dom nodes relying on the `transitionHeight` plugin.

```sass
@import 'node_modules/morphdom-plugins/sass-mixins/transition-height/index'
.transition-on-added {
  @include maxHeightOnAddedTransitions(400ms ease);
}
.transition-on-added.always-show {
  // reset the node to not transition its height when added
  // if it contains the always-show class
  @include resetMaxHeightOnAddedTransitions();
}
.transition-height {
  @include maxHeightTransitions(400ms ease, "is-collapsed");
}
```

```css
  .transition-on-added {
    transition: max-height 400ms ease;
    overflow: hidden;
    max-height: 0;
  }
  .transition-on-added.always-show {
    max-height: initial !important;
  }
  .transition-height {
    transition: max-height 400ms ease;
    overflow: hidden;
  }
  .transition-height.is-collapsed {
      max-height: 0 !important;
  }
```

## attrPersistence

Sometimes, there are attributes you'd like to persist across calls to morphdom that are not controlled by your templates. This comes up a lot when you are using JS to add css rules or classes as the user interacts with your page. Purely interaction attributes should not need to go through your render call. `attrPersistence` lets you persist certain attributes on elements across calls to morphdom.

### Usage

```html
<div
  class="my-element"
  data-persist-class="is-sticky,is-collapsed"
  data-persist-css="height"
>
  ...
</div>
```

Now, whenever `my-element` is re-rendered and updated through morphdom, the state of the `is-sticky`, `is-collapsed` classes or any height-related css properties will be persisted across the morphdom call.

## inputPersistence

`inputPersistence` will help you ensure that the value of `input[type=text],input[type=number]` fields are not overwritten if the input currently has focus. You should take care not to overwrite the value of a field if it has focus, but if, for whatever reason a morphdom call causes the value of an input to update while it has focus, this plugin will prevent it from updating and disorienting the user.

### What problem does the `inputPersistence` plugin solve?

Without this plugin, you run the risk of overwriting the value of `input[type=text],input[type=number]` fields with stale values from your redux state.

The redux philosophy is that that data flows in a single direction. That is, from the state, through the templates, into html, and finally into the DOM. A user typing into a text field is counter to this philosophy because now data needs to flow from the DOM back into the redux state. Typically, the user input is reduced into the redux state by event listener on the input field. If you are throttling the event that updates your state with the new value (you should be!), there exists a small window of opportunity–_after_ the user types into an input, but _before_ your state is updated with the new value–where some other update to the state could trigger a re-render that incorrectly reverts the value of the text input before the new (user input) value is reflected in your state. If this happens, the user would see the text they typed vanish and revert to some former value. This is no good.

### Cool story, but whats the solution?

Don't update a text field if it has focus, because the user is interacting with it. This plugin does that for you, easy as that.

**Note:** if your state that drives the input changes due to something other than user-interaction, and the field is in focus, this plugin will prevent the field from updating, even if doing so is desired. It is likely that proper UX in such a scenario would be to prompt the user to update the stale page state by explicitly clicking a refresh button.

# TODO

- remove jQuery dependency
- enable element to `transition-height-on-added` and `transition-height`
  at the same time–current behavior in this case is undefined
- make `css-transition-group` work more reliably if animation is
  reversed mid-wway through
