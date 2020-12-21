// Namespace MB Configuration Values
export const MB = {};


/* -------------------------------------------- */

/**
 * The set of Ability Scores used within the system
 * @type {Object}
 */
MB.abilities = {
    "strength": "MB.AbilityStr",
    "agility": "MB.AbilityAgi",
    "presence": "MB.AbilityPre",
    "toughness": "MB.AbilityTou"
};

/* -------------------------------------------- */

/**
 * The set of armor tiers
 * @type {Object}
 */
MB.armorTier = {
    0: "MB.ArmorShield",
    1: "MB.ArmorLight",
    2: "MB.ArmorMedium",
    3: "MB.ArmorHeavy"
};

/* -------------------------------------------- */

/**
 * The valid currency denominations supported by the system
 * @type {Object}
 */
MB.currencies = {
    "gp": "MB.CurrencyGP",
    "sp": "MB.CurrencySP",
    "cp": "MB.CurrencyCP",
};

/* -------------------------------------------- */

// Damage Types
MB.damageTypes = {
    "bludgeoning": "MB.DamageBludgeoning",
    "piercing": "MB.DamagePiercing",
    "slashing": "MB.DamageSlashing",
    "magical": "MB.DamageMagical"
};

/* -------------------------------------------- */

MB.distanceUnits = {
    "none": "MB.None",
    "self": "MB.DistSelf",
    "touch": "MB.DistTouch",
    "close": "MB.DistClose",
    "far": "MB.DistFar",
    "nearby": "MB.DistNearby"
};

/* -------------------------------------------- */

/**
 * The available choices for scroll types
 * @type {Object}
 */
MB.scrollTypes = {
    "unclean": "MB.ScrollUnclean",
    "sacred": "MB.ScrollSacred",
    "other": "MB.ScrollOther"
};

/* -------------------------------------------- */

/**
 * Define the set of range types which a weapon item can take
 * @type {Object}
 */
MB.rangeTypes = {
    "ranged": "MB.WeaponTypeRanged",
    "both": "MB.WeaponTypeBoth",
    "melee": "MB.WeaponTypeMelee"
};

/* -------------------------------------------- */

/**
 * The available sources of where a class comes from
 * @type {Object}
 */
MB.classSources = {
    "custom": "MB.ClassSourceCustom",
    "core": "MB.ClassSourceCore",
    "mbc": "MB.ClassSourceMbc"
};

/* -------------------------------------------- */

/*break into 2 functions*/
export class MbClassList {
    static async getClasses(labels_only = true) {
        const pack = game.packs.find(p => p.metadata.label === "Classes");
        let classes = pack ? await pack.getContent() : [];

        let charClassNames = [];
        for (let charClass of classes) {
            let charClassName = charClass.data.name;
            if (charClassNames.includes(charClassName) !== false) {
                classes = classes.filter(item => item._id != charClass._id);
            }
            else {
                charClassNames.push(charClassName);
            }
        }

        // Sort the charClassNames list.
        if (labels_only) {
            charClassNames.sort((a, b) => {
                const aSort = a.toLowerCase();
                const bSort = b.toLowerCase();
                if (aSort < bSort) {
                    return -1;
                }
                if (aSort > bSort) {
                    return 1;
                }
                return 0;
            });
    
            return charClassNames;
        }
        // Sort the class objects list.
        else {
            classes.sort((a, b) => {
                const aSort = a.data.name.toLowerCase();
                const bSort = b.data.name.toLowerCase();
                if (aSort < bSort) {
                    return -1;
                }
                if (aSort > bSort) {
                    return 1;
                }
                return 0;
            });
  
            return classes;
        }
    }
}

export class MbEntityList {
    static async getEntities(type, labels_only = true) {
        const pack = game.packs.find(p => p.metadata.label === type);
        let mbEntities = pack ? await pack.getContent() : [];

        let mbEntityNames = [];
        for (let entity of mbEntities) {
            let entityName = entity.data.name;
            if (mbEntityNames.includes(entityName) !== false) {
                mbEntities = mbEntities.filter(item => item._id != entity._id);
            }
            else {
                mbEntityNames.push(entityName);
            }
        }

        // Sort the mbEntities list.
        if (labels_only) {
            mbEntityNames.sort((a, b) => {
                const aSort = a.toLowerCase();
                const bSort = b.toLowerCase();
                if (aSort < bSort) {
                    return -1;
                }
                if (aSort > bSort) {
                    return 1;
                }
                return 0;
            });
    
            return mbEntityNames;
        }
        // Sort the class objects list.
        else {
            mbEntities.sort((a, b) => {
                const aSort = a.data.name.toLowerCase();
                const bSort = b.data.name.toLowerCase();
                if (aSort < bSort) {
                    return -1;
                }
                if (aSort > bSort) {
                    return 1;
                }
                return 0;
            });
  
            return mbEntities;
        }
    }
}