export type Anectos = {
  address: "26yr8seqaSUEJidnG6yif5W6Fgm84MfkC7UP7ZNAjwgj";
  metadata: {
    name: "anectos";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "closeRound";
      accounts: [
        {
          name: "owner";
          isMut: true;
          isSigner: true;
        },
        {
          name: "fundingRound";
          isMut: true;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "completeMilestone";
      accounts: [
        {
          name: "owner";
          isMut: true;
          isSigner: true;
        },
        {
          name: "project";
          isMut: true;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "milestoneIndex";
          type: "u8";
        },
        {
          name: "currentFunding";
          type: "u64";
        }
      ];
    },
    {
      name: "contribute";
      accounts: [
        {
          name: "fundingRound";
          isMut: true;
          isSigner: false;
        },
        {
          name: "project";
          isMut: true;
          isSigner: false;
        },
        {
          name: "projectVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "contribution";
          isMut: true;
          isSigner: false;
        },
        {
          name: "contributor";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "createProject";
      accounts: [
        {
          name: "owner";
          isMut: true;
          isSigner: true;
        },
        {
          name: "project";
          isMut: true;
          isSigner: false;
        },
        {
          name: "projectVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "projectMeta";
          isMut: true;
          isSigner: false;
        },
        {
          name: "fundingRound";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "projectId";
          type: "string";
        },
        {
          name: "area";
          type: "string";
        },
        {
          name: "title";
          type: "string";
        },
        {
          name: "description";
          type: "string";
        },
        {
          name: "imageUrl";
          type: "string";
        },
        {
          name: "category";
          type: "string";
        },
        {
          name: "fundingGoal";
          type: "u64";
        },
        {
          name: "fundingDeadline";
          type: "i64";
        }
      ];
    },
    {
      name: "initializeFundingRound";
      accounts: [
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "fundingRound";
          isMut: true;
          isSigner: false;
        },
        {
          name: "fundingRoundMeta";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "seed";
          type: "string";
        },
        {
          name: "title";
          type: "string";
        },
        {
          name: "description";
          type: "string";
        },
        {
          name: "applicationStart";
          type: "i64";
        },
        {
          name: "applicationEnd";
          type: "i64";
        },
        {
          name: "votingStart";
          type: "i64";
        },
        {
          name: "votingEnd";
          type: "i64";
        },
        {
          name: "maxParticipants";
          type: "u32";
        }
      ];
    }
  ];
  accounts: [
    {
      name: "project";
      type: {
        kind: "struct";
        fields: [
          {
            name: "projectId";
            type: "string";
          },
          {
            name: "round";
            type: "publicKey";
          },
          {
            name: "area";
            type: "string";
          }
        ];
      };
    },
    {
      name: "fundingRound";
      type: {
        kind: "struct";
        fields: [
          {
            name: "authority";
            type: "publicKey";
          },
          {
            name: "seed";
            type: "string";
          },
          {
            name: "projectCount";
            type: "u32";
          },
          {
            name: "totalFunding";
            type: "u64";
          }
        ];
      };
    }
  ];
  events: [
    {
      name: "ContributionMade";
      fields: [
        {
          name: "contributor";
          type: "publicKey";
          index: false;
        },
        {
          name: "project";
          type: "publicKey";
          index: false;
        },
        {
          name: "amount";
          type: "u64";
          index: false;
        },
        {
          name: "timestamp";
          type: "i64";
          index: false;
        }
      ];
    },
    {
      name: "ProjectCreated";
      fields: [
        {
          name: "project";
          type: "publicKey";
          index: false;
        },
        {
          name: "owner";
          type: "publicKey";
          index: false;
        },
        {
          name: "fundingRound";
          type: "publicKey";
          index: false;
        },
        {
          name: "timestamp";
          type: "i64";
          index: false;
        }
      ];
    },
    {
      name: "MilestoneCompleted";
      fields: [
        {
          name: "project";
          type: "publicKey";
          index: false;
        },
        {
          name: "milestoneIndex";
          type: "u8";
          index: false;
        },
        {
          name: "milestoneAmount";
          type: "u64";
          index: false;
        },
        {
          name: "timestamp";
          type: "i64";
          index: false;
        }
      ];
    }
  ];
  errors: [
    {
      code: 6000;
      name: "InvalidProjectState";
      msg: "Invalid project state";
    },
    {
      code: 6001;
      name: "InsufficientFunds";
      msg: "Insufficient funds";
    },
    {
      code: 6002;
      name: "InvalidMilestone";
      msg: "Invalid milestone";
    },
    {
      code: 6003;
      name: "FundingRoundNotActive";
      msg: "Funding round is not active";
    },
    {
      code: 6004;
      name: "InvalidContributionAmount";
      msg: "Invalid contribution amount";
    },
    {
      code: 6005;
      name: "MilestoneAlreadyCompleted";
      msg: "Milestone already completed";
    }
  ];
};

export const IDL: Anectos = {
  address: "26yr8seqaSUEJidnG6yif5W6Fgm84MfkC7UP7ZNAjwgj",
  metadata: {
    name: "anectos",
    version: "0.1.0",
    spec: "0.1.0",
    description: "Created with Anchor",
  },
  instructions: [
    {
      name: "closeRound",
      accounts: [
        {
          name: "owner",
          isMut: true,
          isSigner: true,
        },
        {
          name: "fundingRound",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "completeMilestone",
      accounts: [
        {
          name: "owner",
          isMut: true,
          isSigner: true,
        },
        {
          name: "project",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "milestoneIndex",
          type: "u8",
        },
        {
          name: "currentFunding",
          type: "u64",
        },
      ],
    },
    {
      name: "contribute",
      accounts: [
        {
          name: "fundingRound",
          isMut: true,
          isSigner: false,
        },
        {
          name: "project",
          isMut: true,
          isSigner: false,
        },
        {
          name: "projectVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "contribution",
          isMut: true,
          isSigner: false,
        },
        {
          name: "contributor",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
    {
      name: "createProject",
      accounts: [
        {
          name: "owner",
          isMut: true,
          isSigner: true,
        },
        {
          name: "project",
          isMut: true,
          isSigner: false,
        },
        {
          name: "projectVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "projectMeta",
          isMut: true,
          isSigner: false,
        },
        {
          name: "fundingRound",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "projectId",
          type: "string",
        },
        {
          name: "area",
          type: "string",
        },
        {
          name: "title",
          type: "string",
        },
        {
          name: "description",
          type: "string",
        },
        {
          name: "imageUrl",
          type: "string",
        },
        {
          name: "category",
          type: "string",
        },
        {
          name: "fundingGoal",
          type: "u64",
        },
        {
          name: "fundingDeadline",
          type: "i64",
        },
      ],
    },
    {
      name: "initializeFundingRound",
      accounts: [
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "fundingRound",
          isMut: true,
          isSigner: false,
        },
        {
          name: "fundingRoundMeta",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "seed",
          type: "string",
        },
        {
          name: "title",
          type: "string",
        },
        {
          name: "description",
          type: "string",
        },
        {
          name: "applicationStart",
          type: "i64",
        },
        {
          name: "applicationEnd",
          type: "i64",
        },
        {
          name: "votingStart",
          type: "i64",
        },
        {
          name: "votingEnd",
          type: "i64",
        },
        {
          name: "maxParticipants",
          type: "u32",
        },
      ],
    },
  ],
  accounts: [
    {
      name: "project",
      type: {
        kind: "struct",
        fields: [
          {
            name: "projectId",
            type: "string",
          },
          {
            name: "round",
            type: "publicKey",
          },
          {
            name: "area",
            type: "string",
          },
        ],
      },
    },
    {
      name: "fundingRound",
      type: {
        kind: "struct",
        fields: [
          {
            name: "authority",
            type: "publicKey",
          },
          {
            name: "seed",
            type: "string",
          },
          {
            name: "projectCount",
            type: "u32",
          },
          {
            name: "totalFunding",
            type: "u64",
          },
        ],
      },
    },
  ],
  events: [
    {
      name: "ContributionMade",
      fields: [
        {
          name: "contributor",
          type: "publicKey",
          index: false,
        },
        {
          name: "project",
          type: "publicKey",
          index: false,
        },
        {
          name: "amount",
          type: "u64",
          index: false,
        },
        {
          name: "timestamp",
          type: "i64",
          index: false,
        },
      ],
    },
    {
      name: "ProjectCreated",
      fields: [
        {
          name: "project",
          type: "publicKey",
          index: false,
        },
        {
          name: "owner",
          type: "publicKey",
          index: false,
        },
        {
          name: "fundingRound",
          type: "publicKey",
          index: false,
        },
        {
          name: "timestamp",
          type: "i64",
          index: false,
        },
      ],
    },
    {
      name: "MilestoneCompleted",
      fields: [
        {
          name: "project",
          type: "publicKey",
          index: false,
        },
        {
          name: "milestoneIndex",
          type: "u8",
          index: false,
        },
        {
          name: "milestoneAmount",
          type: "u64",
          index: false,
        },
        {
          name: "timestamp",
          type: "i64",
          index: false,
        },
      ],
    },
  ],
  errors: [
    {
      code: 6000,
      name: "InvalidProjectState",
      msg: "Invalid project state",
    },
    {
      code: 6001,
      name: "InsufficientFunds",
      msg: "Insufficient funds",
    },
    {
      code: 6002,
      name: "InvalidMilestone",
      msg: "Invalid milestone",
    },
    {
      code: 6003,
      name: "FundingRoundNotActive",
      msg: "Funding round is not active",
    },
    {
      code: 6004,
      name: "InvalidContributionAmount",
      msg: "Invalid contribution amount",
    },
    {
      code: 6005,
      name: "MilestoneAlreadyCompleted",
      msg: "Milestone already completed",
    },
  ],
};
