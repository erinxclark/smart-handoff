# Storybook Integration Example

## Generated Story File Example

When you click "Export to Storybook" in Smart Handoff, it generates a complete `.stories.js` file. Here's an example for a detected Button component:

### Button.stories.js
```javascript
import Button from './Button';

export default {
  title: 'Generated/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Auto-generated component from Figma design (button, 95% confidence)',
      },
    },
  },
};

export const Default = {
  args: {},
};

export const Primary = {
  args: {
    variant: 'default',
  },
};

export const Secondary = {
  args: {
    variant: 'secondary',
  },
};

export const Disabled = {
  args: {
    disabled: true,
  },
};

export const Large = {
  args: {
    size: 'lg',
  },
};

export const Small = {
  args: {
    size: 'sm',
  },
};
```

### Card.stories.js Example
```javascript
import Card from './Card';

export default {
  title: 'Generated/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Auto-generated component from Figma design (card, 85% confidence)',
      },
    },
  },
};

export const Default = {
  args: {},
};

export const WithContent = {
  args: {},
  render: (args) => (
    <Card {...args}>
      <h3>Card Title</h3>
      <p>This is card content with some text to demonstrate the layout.</p>
      <button>Action Button</button>
    </Card>
  ),
};

export const Empty = {
  args: {},
  render: (args) => (
    <Card {...args}>
      {/* Empty card */}
    </Card>
  ),
};
```

## Features

✅ **Automatic Component Detection**: Stories are generated based on detected component type  
✅ **Multiple Variants**: Each component type gets relevant story variants  
✅ **CSF 3.0 Format**: Modern Storybook format with auto-documentation  
✅ **Confidence Display**: Shows detection confidence in component description  
✅ **Preview Before Download**: Modal shows generated story content  
✅ **Smart Naming**: Automatic filename generation based on component name  
✅ **Design System Ready**: Perfect for component library documentation  

## Usage in Storybook

1. Download the generated `.stories.js` file
2. Place it in your Storybook stories directory
3. Ensure your component file is in the same directory
4. Start Storybook to see your component with all variants
5. Use the auto-generated documentation for team reference

This integration makes Smart Handoff perfect for design systems and component libraries! 🚀
