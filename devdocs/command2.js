// where 0 is 2C, 1 is 2D, 2 is 2E

export default [
  {
    representations: [0x0],
    group: 0,
    name: '',
    description: '',
    returnValue:
    {
      type: 'void',
      description: '',
    },
    arguments:
    [
      {
        name: '',
        type: 'int',
        description: '',
      },
    ],
  },
  {
    representations: [0x1],
    group: 0,
    name: 'Pop',
    description: 'Pops an element off the literal stack.',
    returnValue: 
    {
      type: 'void',
      description: '',
    },
    arguments:
    [
      {
        name: 'item',
        type: 'any',
        description: 'Index of stack to pop? Relative or absolute? No customization at all?',
      },
    ],
  },
  {
    representations: [0x101],
    group: 0,
    name: 'CreateEventObject',
    description: 'Creates an object without AI(?) at the provided Spawnpoint.',
    returnValue:
    {
      type: 'int',
      description: 'ID of object created.',
    },
    arguments:
    [
      {
        name: 'Spawnpoint',
        type: 'string',
        description: 'The RMPA spawnpoint the object will spawn at.',
      },
      {
        name: 'SGO_FileName',
        type: 'string',
        description: 'The object SGO to spawn.',
      },
    ],
  },
  {
    representations: [0x2],
    group: 0,
    name: 'RegisterEvent',
    description: 'Registers a function for use with an event factor. If no factor is specified soon after, function will fire automatically.',
    returnValue: 
    {
      type: 'void',
      description: '',
    },
    arguments:
    [
      {
        name: 'FunctionName',
        type: 'string',
        description: 'Name of local function to call.',
      },
      {
        name: '',
        type: 'float',
        description: 'Usually 1.0f',
      },
      {
        name: 'MultiFunction?',
        type: 'bool',
        description: 'multiple_functions_per_event?',
      },
    ],
  },
  {
    representations: [0x102],
    group: 0,
    name: 'CreateEventObject2',
    description: 'Creates an object without AI(?) at the provided Spawnpoint. Unknown difference between first version.',
    returnValue:
    {
      type: 'int',
      description: 'ID of object created.',
    },
    arguments:
    [
      {
        name: 'Spawnpoint',
        type: 'string',
        description: 'The RMPA spawnpoint the object will spawn at.',
      },
      {
        name: 'SGO_FileName',
        type: 'string',
        description: 'The object SGO to spawn.',
      },
    ],
  },
  {
    representations: [0x3],
    group: 0,
    name: '',
    description: '',
    returnValue:
    {
      type: 'void',
      description: '',
    },
    arguments:
    [
      {
        name: '',
        type: 'int',
        description: '',
      },
    ],
  },
  {
    representations: [0x103],
    group: 0,
    name: '',
    description: 'AC 03 XX (XX != 0)',
    returnValue:
    {
      type: 'void',
      description: '',
    },
    arguments:
    [],
  },
  {
    representations: [0x2328],
    group: 0,
    name: 'CreateEventFactorWait',
    description: 'Creates an event factor that will call an event after TimeDelta seconds.',
    returnValue:
    {
      type: 'void',
      description: '',
    },
    arguments:
    [
      {
        name: 'TimeDelta',
        type: 'float',
        description: 'The time, in seconds, before the event is fired.',
      },
    ],
  },
]
