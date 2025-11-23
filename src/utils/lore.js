const LORE_DB = {
    'lore_start': "Traveler, the path ahead is sealed. Seek the three Ancient Runes hidden in these ruins to open the way.",
    'lore_ruins_1': "The first King cast his crown into the abyss, fearing what he had become. (Rune 1/3 Found)",
    'lore_ruins_2': "Shadows are not merely the absence of light, but the presence of a hunger that never fades. (Rune 2/3 Found)",
    'lore_ruins_3': "The gate responds to memory. Only those who know the history of this place may leave it. (Rune 3/3 Found)",
    'lore_z1': "The sky islands drift aimlessly, untethered from the world below. (Rune 1/3 Found)",
    'lore_sky_1': "We sought to escape the rot by building upward, but we only brought the sickness with us. (Rune 2/3 Found)",
    'lore_sky_2': "The wind whispers names of those long forgotten. To ascend is to leave them behind. (Rune 3/3 Found)",
    'default': "The inscription is worn away by time..."
};

export const getLore = (id) => {
    return LORE_DB[id] || LORE_DB['default'];
};