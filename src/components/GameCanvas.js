import { jsx as _jsx } from "react/jsx-runtime";
import React, { useRef, useEffect, useCallback } from 'react';
import { GameState } from '../types.js';
import { GRAVITY, FRICTION, MOVE_SPEED, MAX_SPEED, JUMP_FORCE, MAX_JUMPS, DASH_SPEED, DASH_DURATION, DASH_COOLDOWN, ATTACK_COOLDOWN, ATTACK_DURATION, INVINCIBILITY_DURATION, COLORS, WORLD_WIDTH, WORLD_HEIGHT } from '../utils/constants.js';
// Helper to check AABB collision
const checkCollision = (a, b) => {
    return (a.pos.x < b.pos.x + b.size.x &&
        a.pos.x + a.size.x > b.pos.x &&
        a.pos.y < b.pos.y + b.size.y &&
        a.pos.y + a.size.y > b.pos.y);
};
const getSpawnPoint = (zoneIndex) => {
    switch (zoneIndex) {
        case 0: return { x: 100, y: 200 };
        case 1: return { x: 50, y: 350 };
        case 2: return { x: 50, y: 350 };
        default: return { x: 100, y: 200 };
    }
};
const GameCanvas = ({ gameState, setGameState, onUpdateHealth, onInteract, collectedLore, onUpdateRunes }) => {
    const canvasRef = useRef(null);
    const requestRef = useRef(0);
    // Game State Refs (Mutable for performance)
    const playerRef = useRef({
        id: 'player',
        pos: { x: 100, y: 200 },
        size: { x: 30, y: 50 },
        velocity: { x: 0, y: 0 },
        color: COLORS.PLAYER,
        isGrounded: false,
        jumpsRemaining: MAX_JUMPS,
        facingRight: true,
        isDashing: false,
        dashCooldown: 0,
        attackCooldown: 0,
        health: 5,
        maxHealth: 5,
        invincibleTimer: 0
    });
    const currentZoneRef = useRef(0);
    const platformsRef = useRef([]);
    const enemiesRef = useRef([]);
    const particlesRef = useRef([]);
    const interactablesRef = useRef([]);
    const hazardsRef = useRef([]);
    const attackHitboxRef = useRef(null);
    const cameraRef = useRef({ x: 0, y: 0 });
    const globalTimeRef = useRef(0);
    const gateMessageRef = useRef("");
    const gateMessageTimerRef = useRef(0);
    const hasBossKeyRef = useRef(false);
    // Input State
    const keys = useRef({});
    const dashFrame = useRef(0);
    // Level Generation
    const loadZone = useCallback((zoneIndex) => {
        currentZoneRef.current = zoneIndex;
        const platforms = [];
        const enemies = [];
        const hazards = [];
        const interactables = [];
        // Common Ceil/Floor Base
        platforms.push({ id: 'ceil', pos: { x: 0, y: -50 }, size: { x: WORLD_WIDTH, y: 50 }, color: COLORS.PLATFORM, type: 'solid' }, { id: 'floor_base', pos: { x: 0, y: WORLD_HEIGHT - 50 }, size: { x: WORLD_WIDTH, y: 50 }, color: COLORS.PLATFORM, type: 'solid' });
        if (zoneIndex === 0) {
            // --- ZONE 0: The Ruins (Original Level) ---
            // Floor Hazard
            hazards.push({ id: 'floor_spikes', pos: { x: 0, y: WORLD_HEIGHT - 80 }, size: { x: WORLD_WIDTH, y: 30 }, type: 'spikes', color: COLORS.HAZARD });
            // Borders (Open on Right)
            platforms.push({ id: 'wall_l', pos: { x: -50, y: 0 }, size: { x: 50, y: WORLD_HEIGHT }, color: COLORS.PLATFORM, type: 'solid' });
            // Top Left Start
            platforms.push({ id: 'start_plat', pos: { x: 0, y: 300 }, size: { x: 300, y: 50 }, color: COLORS.PLATFORM, type: 'solid' }, { id: 'p1', pos: { x: 350, y: 350 }, size: { x: 100, y: 20 }, color: COLORS.PLATFORM, type: 'solid' }, { id: 'p2', pos: { x: 550, y: 450 }, size: { x: 150, y: 20 }, color: COLORS.PLATFORM, type: 'solid' });
            // Vertical Shaft
            platforms.push({ id: 'drop1', pos: { x: 800, y: 400 }, size: { x: 100, y: 20 }, color: COLORS.PLATFORM, type: 'solid' }, { id: 'drop2', pos: { x: 950, y: 550 }, size: { x: 100, y: 20 }, color: COLORS.PLATFORM, type: 'solid' }, { id: 'drop3', pos: { x: 750, y: 700 }, size: { x: 100, y: 20 }, color: COLORS.PLATFORM, type: 'solid' }, { id: 'drop4', pos: { x: 1000, y: 850 }, size: { x: 100, y: 20 }, color: COLORS.PLATFORM, type: 'solid' });
            // NEW RUNE 1
            interactables.push({ id: 'lore_ruins_1', pos: { x: 970, y: 510 }, size: { x: 30, y: 40 }, color: COLORS.INTERACTABLE, type: 'lore_tablet', triggered: false });
            enemies.push({ id: 'f1', pos: { x: 850, y: 600 }, size: { x: 30, y: 30 }, color: COLORS.ENEMY_FLYER, velocity: { x: 2, y: 0 }, type: 'flyer', health: 2, patrolStart: 750, patrolEnd: 1050 });
            // The Pit
            platforms.push({ id: 'pit_plat1', pos: { x: 200, y: 1100 }, size: { x: 150, y: 20 }, color: COLORS.PLATFORM, type: 'solid' }, { id: 'pit_plat2', pos: { x: 500, y: 1100 }, size: { x: 150, y: 20 }, color: COLORS.PLATFORM, type: 'solid' }, { id: 'pit_safe', pos: { x: 800, y: 1200 }, size: { x: 400, y: 50 }, color: COLORS.PLATFORM, type: 'solid' });
            enemies.push({ id: 'c1', pos: { x: 850, y: 1160 }, size: { x: 40, y: 40 }, color: COLORS.ENEMY_CRAWLER, velocity: { x: 3, y: 0 }, type: 'crawler', health: 3, patrolStart: 800, patrolEnd: 1200 });
            // NEW RUNE 2 (Bottom Left)
            interactables.push({ id: 'lore_ruins_2', pos: { x: 250, y: 1060 }, size: { x: 30, y: 40 }, color: COLORS.INTERACTABLE, type: 'lore_tablet', triggered: false });
            // The Ascent (Right Side)
            platforms.push({ id: 'asc1', pos: { x: 1300, y: 1000 }, size: { x: 100, y: 20 }, color: COLORS.PLATFORM, type: 'solid' }, { id: 'asc2', pos: { x: 1500, y: 850 }, size: { x: 100, y: 20 }, color: COLORS.PLATFORM, type: 'solid' }, { id: 'asc3', pos: { x: 1700, y: 700 }, size: { x: 200, y: 20 }, color: COLORS.PLATFORM, type: 'solid' }, { id: 'asc4', pos: { x: 1400, y: 550 }, size: { x: 150, y: 20 }, color: COLORS.PLATFORM, type: 'solid' }, { id: 'asc_final', pos: { x: 1600, y: 400 }, size: { x: 400, y: 50 }, color: COLORS.PLATFORM, type: 'solid' } // Extends to edge
            );
            // NEW RUNE 3 (Top Right near exit)
            interactables.push({ id: 'lore_ruins_3', pos: { x: 1750, y: 660 }, size: { x: 30, y: 40 }, color: COLORS.INTERACTABLE, type: 'lore_tablet', triggered: false });
            enemies.push({ id: 'f2', pos: { x: 1600, y: 800 }, size: { x: 30, y: 30 }, color: COLORS.ENEMY_FLYER, velocity: { x: 2.5, y: 0 }, type: 'flyer', health: 2, patrolStart: 1500, patrolEnd: 1800 });
        }
        else if (zoneIndex === 1) {
            // --- ZONE 1: The Gauntlet (Harder) ---
            // Floor Hazard
            hazards.push({ id: 'floor_spikes', pos: { x: 0, y: WORLD_HEIGHT - 80 }, size: { x: WORLD_WIDTH, y: 30 }, type: 'spikes', color: COLORS.HAZARD });
            // Entry Platform
            platforms.push({ id: 'z1_start', pos: { x: 0, y: 400 }, size: { x: 200, y: 50 }, color: COLORS.PLATFORM, type: 'solid' });
            // Floating Islands Sequence
            platforms.push({ id: 'z1_p1', pos: { x: 300, y: 450 }, size: { x: 100, y: 20 }, color: COLORS.PLATFORM, type: 'solid' }, { id: 'z1_p2', pos: { x: 500, y: 350 }, size: { x: 100, y: 20 }, color: COLORS.PLATFORM, type: 'solid' }, { id: 'z1_p3', pos: { x: 750, y: 500 }, size: { x: 200, y: 30 }, color: COLORS.PLATFORM, type: 'solid' }, // Middle Safe spot
            { id: 'z1_p4', pos: { x: 1100, y: 400 }, size: { x: 100, y: 20 }, color: COLORS.PLATFORM, type: 'solid' }, { id: 'z1_p5', pos: { x: 1350, y: 600 }, size: { x: 100, y: 20 }, color: COLORS.PLATFORM, type: 'solid' }, { id: 'z1_p6', pos: { x: 1600, y: 500 }, size: { x: 100, y: 20 }, color: COLORS.PLATFORM, type: 'solid' }, { id: 'z1_end', pos: { x: 1800, y: 400 }, size: { x: 200, y: 50 }, color: COLORS.PLATFORM, type: 'solid' });
            // Low platforms near spikes for risk/reward
            platforms.push({ id: 'z1_low1', pos: { x: 600, y: 1000 }, size: { x: 100, y: 20 }, color: COLORS.PLATFORM, type: 'solid' }, { id: 'z1_low2', pos: { x: 1200, y: 1100 }, size: { x: 100, y: 20 }, color: COLORS.PLATFORM, type: 'solid' });
            // Recovery Platforms
            platforms.push({ id: 'z1_rec1', pos: { x: 450, y: 750 }, size: { x: 80, y: 20 }, color: COLORS.PLATFORM, type: 'solid' }, { id: 'z1_rec2', pos: { x: 850, y: 800 }, size: { x: 80, y: 20 }, color: COLORS.PLATFORM, type: 'solid' }, { id: 'z1_rec3', pos: { x: 1450, y: 850 }, size: { x: 80, y: 20 }, color: COLORS.PLATFORM, type: 'solid' });
            // Enemies - LOTS of flyers
            enemies.push({ id: 'z1_f1', pos: { x: 400, y: 300 }, size: { x: 30, y: 30 }, color: COLORS.ENEMY_FLYER, velocity: { x: 2, y: 0 }, type: 'flyer', health: 2, patrolStart: 300, patrolEnd: 600 }, { id: 'z1_f2', pos: { x: 900, y: 400 }, size: { x: 30, y: 30 }, color: COLORS.ENEMY_FLYER, velocity: { x: -3, y: 0 }, type: 'flyer', health: 2, patrolStart: 800, patrolEnd: 1200 }, { id: 'z1_f3', pos: { x: 1200, y: 500 }, size: { x: 30, y: 30 }, color: COLORS.ENEMY_FLYER, velocity: { x: 3, y: 0 }, type: 'flyer', health: 2, patrolStart: 1100, patrolEnd: 1500 }, { id: 'z1_f4', pos: { x: 1500, y: 300 }, size: { x: 30, y: 30 }, color: COLORS.ENEMY_FLYER, velocity: { x: 4, y: 0 }, type: 'flyer', health: 2, patrolStart: 1400, patrolEnd: 1700 }, 
            // Low Flyer
            { id: 'z1_f5', pos: { x: 1000, y: 900 }, size: { x: 30, y: 30 }, color: COLORS.ENEMY_FLYER, velocity: { x: 2, y: 0 }, type: 'flyer', health: 2, patrolStart: 600, patrolEnd: 1400 });
            // Crawlers on islands
            enemies.push({ id: 'z1_c1', pos: { x: 800, y: 460 }, size: { x: 40, y: 40 }, color: COLORS.ENEMY_CRAWLER, velocity: { x: 2, y: 0 }, type: 'crawler', health: 3, patrolStart: 750, patrolEnd: 950 }, { id: 'z1_c2', pos: { x: 1850, y: 360 }, size: { x: 40, y: 40 }, color: COLORS.ENEMY_CRAWLER, velocity: { x: 1, y: 0 }, type: 'crawler', health: 3, patrolStart: 1800, patrolEnd: 1950 });
            // Lore / Key Items
            // RUNE 1
            interactables.push({ id: 'lore_z1', pos: { x: 1900, y: 360 }, size: { x: 30, y: 40 }, color: COLORS.INTERACTABLE, type: 'lore_tablet', triggered: false });
            // RUNE 2 (Risk)
            interactables.push({ id: 'lore_sky_1', pos: { x: 630, y: 960 }, size: { x: 30, y: 40 }, color: COLORS.INTERACTABLE, type: 'lore_tablet', triggered: false });
            // RUNE 3 (High up)
            interactables.push({ id: 'lore_sky_2', pos: { x: 1380, y: 560 }, size: { x: 30, y: 40 }, color: COLORS.INTERACTABLE, type: 'lore_tablet', triggered: false });
        }
        else if (zoneIndex === 2) {
            // --- ZONE 2: The Sanctum (Boss Room) ---
            // Floor Hazard (Prevent getting stuck)
            hazards.push({ id: 'floor_spikes', pos: { x: 0, y: WORLD_HEIGHT - 80 }, size: { x: WORLD_WIDTH, y: 30 }, type: 'spikes', color: COLORS.HAZARD });
            // Borders (Open Left, Closed Right)
            platforms.push({ id: 'wall_r', pos: { x: WORLD_WIDTH, y: 0 }, size: { x: 50, y: WORLD_HEIGHT }, color: COLORS.PLATFORM, type: 'solid' });
            // Entry Platform
            platforms.push({ id: 'z2_start', pos: { x: 0, y: 400 }, size: { x: 200, y: 50 }, color: COLORS.PLATFORM, type: 'solid' });
            // Arena Floor (Big and flat)
            platforms.push({ id: 'arena_floor', pos: { x: 300, y: 800 }, size: { x: 1400, y: 100 }, color: COLORS.PLATFORM, type: 'solid' });
            // Arena Walls to trap player (Psychological or literal)
            platforms.push({ id: 'arena_wall_l', pos: { x: 250, y: 500 }, size: { x: 50, y: 400 }, color: COLORS.PLATFORM, type: 'solid' }, { id: 'arena_wall_r', pos: { x: 1700, y: 500 }, size: { x: 50, y: 400 }, color: COLORS.PLATFORM, type: 'solid' });
            // Some floating platforms for maneuvering
            platforms.push({ id: 'z2_p1', pos: { x: 500, y: 600 }, size: { x: 200, y: 20 }, color: COLORS.PLATFORM, type: 'solid' }, { id: 'z2_p2', pos: { x: 1300, y: 600 }, size: { x: 200, y: 20 }, color: COLORS.PLATFORM, type: 'solid' }, { id: 'z2_p3', pos: { x: 900, y: 450 }, size: { x: 200, y: 20 }, color: COLORS.PLATFORM, type: 'solid' });
            // FINAL GATE (The Goal)
            platforms.push({ id: 'gate_plat', pos: { x: 1800, y: 600 }, size: { x: 150, y: 20 }, color: COLORS.PLATFORM, type: 'solid' });
            interactables.push({
                id: 'final_gate',
                pos: { x: 1850, y: 450 },
                size: { x: 60, y: 150 },
                color: '#000',
                type: 'final_gate',
                triggered: false
            });
            // THE BOSS
            enemies.push({
                id: 'BOSS_1',
                pos: { x: 1200, y: 700 },
                size: { x: 80, y: 100 },
                color: COLORS.ENEMY_BOSS,
                velocity: { x: 0, y: 0 },
                type: 'boss',
                health: 40, // High Health
                patrolStart: 300, // Arena bounds
                patrolEnd: 1600, // Reduced to ensure boss stays on platform
                aiTimer: 60, // Start with small delay
                aiState: 'idle'
            });
        }
        platformsRef.current = platforms;
        enemiesRef.current = enemies;
        hazardsRef.current = hazards;
        interactablesRef.current = interactables;
        particlesRef.current = []; // Clear particles on transition
        hasBossKeyRef.current = false; // Reset key on level load
    }, []);
    // Sync collected status and update UI count
    useEffect(() => {
        let runeCount = 0;
        let maxRunes = 0;
        interactablesRef.current.forEach(item => {
            if (item.type === 'lore_tablet') {
                maxRunes++;
                if (collectedLore.includes(item.id)) {
                    item.triggered = true;
                    runeCount++;
                }
                else {
                    // Explicitly reset if not in list (e.g. after death)
                    item.triggered = false;
                }
            }
        });
        onUpdateRunes(runeCount, maxRunes);
    }, [collectedLore, onUpdateRunes]);
    // State Management / Checkpoints
    useEffect(() => {
        if (gameState === GameState.MENU) {
            // Reset game to start if returning to menu
            currentZoneRef.current = 0;
            loadZone(0);
            playerRef.current.health = 5;
            playerRef.current.pos = getSpawnPoint(0);
            playerRef.current.velocity = { x: 0, y: 0 };
            onUpdateHealth(5);
        }
        else if (gameState === GameState.PLAYING) {
            // If player is dead (respawning), reset to current checkpoint
            if (playerRef.current.health <= 0) {
                loadZone(currentZoneRef.current);
                const spawn = getSpawnPoint(currentZoneRef.current);
                playerRef.current.pos = { ...spawn };
                playerRef.current.velocity = { x: 0, y: 0 };
                playerRef.current.health = 5;
                playerRef.current.jumpsRemaining = MAX_JUMPS;
                playerRef.current.invincibleTimer = 0;
                onUpdateHealth(5);
            }
        }
    }, [gameState, loadZone, onUpdateHealth]);
    // Input Listeners
    useEffect(() => {
        const handleKeyDown = (e) => {
            keys.current[e.code] = true;
            if (gameState === GameState.PLAYING) {
                // Jump (with Double Jump)
                if ((e.code === 'Space' || e.code === 'KeyZ' || e.code === 'ArrowUp' || e.code === 'KeyW')) {
                    // Prevent auto-jumping when holding the key
                    if (!e.repeat && playerRef.current.jumpsRemaining > 0) {
                        playerRef.current.velocity.y = JUMP_FORCE;
                        playerRef.current.isGrounded = false;
                        playerRef.current.jumpsRemaining--;
                        // Visuals
                        createParticles(playerRef.current.pos.x + playerRef.current.size.x / 2, playerRef.current.pos.y + playerRef.current.size.y, 5, '#fff');
                    }
                }
                // Dash
                if ((e.code === 'ShiftLeft' || e.code === 'KeyC') && !playerRef.current.isDashing && playerRef.current.dashCooldown <= 0) {
                    playerRef.current.isDashing = true;
                    playerRef.current.dashCooldown = DASH_COOLDOWN;
                    dashFrame.current = DASH_DURATION;
                    playerRef.current.velocity.x = playerRef.current.facingRight ? DASH_SPEED : -DASH_SPEED;
                    playerRef.current.velocity.y = 0;
                }
                // Attack
                if ((e.code === 'KeyX' || e.code === 'ControlLeft') && playerRef.current.attackCooldown <= 0) {
                    performAttack();
                }
                // Interact
                if (e.code === 'KeyE') {
                    checkInteractions();
                }
            }
        };
        const handleKeyUp = (e) => {
            keys.current[e.code] = false;
            if (gameState === GameState.PLAYING) {
                if ((e.code === 'Space' || e.code === 'KeyZ' || e.code === 'ArrowUp' || e.code === 'KeyW')) {
                    // Variable Jump Height
                    if (playerRef.current.velocity.y < 0) {
                        playerRef.current.velocity.y *= 0.5;
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameState, onInteract]);
    const performAttack = () => {
        const p = playerRef.current;
        p.attackCooldown = ATTACK_COOLDOWN;
        const reach = 60;
        const hb = {
            id: Date.now().toString(),
            pos: {
                x: p.facingRight ? p.pos.x + p.size.x : p.pos.x - reach,
                y: p.pos.y + 10
            },
            size: { x: reach, y: 30 },
            duration: ATTACK_DURATION,
            damage: 1
        };
        attackHitboxRef.current = hb;
        createParticles(hb.pos.x + hb.size.x / 2, hb.pos.y + hb.size.y / 2, 3, '#fff');
    };
    const createParticles = (x, y, count, color) => {
        for (let i = 0; i < count; i++) {
            particlesRef.current.push({
                id: Math.random().toString(),
                pos: { x, y },
                velocity: { x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.5) * 5 },
                life: 20 + Math.random() * 20,
                maxLife: 40,
                color: color,
                size: 2 + Math.random() * 3
            });
        }
    };
    const checkInteractions = () => {
        const p = playerRef.current;
        for (const i of interactablesRef.current) {
            if (checkCollision(p, i)) {
                if (i.type === 'lore_tablet') {
                    onInteract(i.id, i.type);
                    i.triggered = true;
                    setGameState(GameState.DIALOGUE);
                }
                else if (i.type === 'chest') {
                    if (!i.triggered) {
                        i.triggered = true;
                        // Spawn Loot Particles
                        createParticles(i.pos.x + i.size.x / 2, i.pos.y, 20, '#fbbf24'); // Gold
                        // Spawn Key
                        interactablesRef.current.push({
                            id: 'boss_key',
                            pos: { x: i.pos.x + 15, y: i.pos.y - 40 },
                            size: { x: 30, y: 30 },
                            color: '#22d3ee', // Cyan
                            type: 'boss_key',
                            triggered: false
                        });
                    }
                }
                else if (i.type === 'boss_key') {
                    if (!i.triggered) {
                        i.triggered = true; // Hides it
                        hasBossKeyRef.current = true;
                        createParticles(i.pos.x + i.size.x / 2, i.pos.y + i.size.y / 2, 15, '#22d3ee');
                        gateMessageRef.current = "Shadow Key Acquired";
                        gateMessageTimerRef.current = 100;
                    }
                }
                else if (i.type === 'final_gate') {
                    if (hasBossKeyRef.current) {
                        setGameState(GameState.GAME_WON);
                    }
                    else {
                        gateMessageRef.current = "Sealed. Requires Shadow Key.";
                        gateMessageTimerRef.current = 100;
                    }
                }
            }
        }
    };
    const takeDamage = (amount, knockbackDir) => {
        const p = playerRef.current;
        if (p.invincibleTimer > 0)
            return;
        p.health -= amount;
        p.invincibleTimer = INVINCIBILITY_DURATION;
        onUpdateHealth(p.health);
        // Knockback - Reduced
        p.velocity.x = knockbackDir * 6;
        p.velocity.y = -5;
        p.isDashing = false;
        dashFrame.current = 0;
        createParticles(p.pos.x + p.size.x / 2, p.pos.y + p.size.y / 2, 10, '#ff0000');
        if (p.health <= 0) {
            setGameState(GameState.GAME_OVER);
        }
    };
    // Update Loop
    const update = useCallback(() => {
        if (gameState !== GameState.PLAYING)
            return;
        globalTimeRef.current += 0.05;
        const p = playerRef.current;
        // Check Gate Status
        const totalRunes = interactablesRef.current.filter(i => i.type === 'lore_tablet').length;
        const collectedRunes = interactablesRef.current.filter(i => i.type === 'lore_tablet' && i.triggered).length;
        const isLocked = totalRunes > 0 && collectedRunes < totalRunes;
        // --- PLAYER LOGIC ---
        if (p.invincibleTimer > 0)
            p.invincibleTimer--;
        if (p.isDashing) {
            dashFrame.current--;
            if (dashFrame.current <= 0) {
                p.isDashing = false;
                p.velocity.x = 0;
            }
            createParticles(p.pos.x + p.size.x / 2, p.pos.y + p.size.y / 2, 1, COLORS.PLAYER_CLOAK);
        }
        else {
            // Movement
            if (keys.current['ArrowLeft'] || keys.current['KeyA']) {
                p.velocity.x -= MOVE_SPEED;
                p.facingRight = false;
            }
            if (keys.current['ArrowRight'] || keys.current['KeyD']) {
                p.velocity.x += MOVE_SPEED;
                p.facingRight = true;
            }
            p.velocity.x *= FRICTION;
            p.velocity.x = Math.max(Math.min(p.velocity.x, MAX_SPEED), -MAX_SPEED);
            p.velocity.y += GRAVITY;
            if (p.dashCooldown > 0)
                p.dashCooldown--;
            if (p.attackCooldown > 0)
                p.attackCooldown--;
        }
        // Apply X
        p.pos.x += p.velocity.x;
        // Collision X
        for (const plat of platformsRef.current) {
            if (checkCollision(p, plat)) {
                if (p.velocity.x > 0) {
                    p.pos.x = plat.pos.x - p.size.x;
                }
                else if (p.velocity.x < 0) {
                    p.pos.x = plat.pos.x + plat.size.x;
                }
                p.velocity.x = 0;
            }
        }
        // Apply Y
        p.pos.y += p.velocity.y;
        p.isGrounded = false;
        // Collision Y
        for (const plat of platformsRef.current) {
            if (checkCollision(p, plat)) {
                if (p.velocity.y > 0) {
                    // Landing Particles
                    if (p.velocity.y > 8) { // Hard landing
                        createParticles(p.pos.x + p.size.x / 2, plat.pos.y, 8, '#e2e8f0');
                    }
                    p.pos.y = plat.pos.y - p.size.y;
                    p.isGrounded = true;
                    p.jumpsRemaining = MAX_JUMPS; // Reset jumps on ground
                    p.velocity.y = 0;
                }
                else if (p.velocity.y < 0) {
                    p.pos.y = plat.pos.y + plat.size.y;
                    p.velocity.y = 0;
                }
            }
        }
        // --- SCREEN TRANSITIONS ---
        // Go Right (With Lock Check)
        if (p.pos.x > WORLD_WIDTH - p.size.x) {
            if (isLocked) {
                // Block
                p.pos.x = WORLD_WIDTH - p.size.x;
                p.velocity.x = 0;
                gateMessageRef.current = "Sealed by Ancient Runes";
                gateMessageTimerRef.current = 100;
            }
            else {
                const nextZone = currentZoneRef.current + 1;
                // Supports Zones 0, 1, 2
                if (nextZone <= 2) {
                    loadZone(nextZone);
                    p.pos.x = 50; // Spawn left
                    p.velocity.x = 0;
                    // Ensure safe Y for new zone
                    p.pos.y = 350;
                    p.velocity.y = 0;
                }
                else {
                    p.pos.x = WORLD_WIDTH - p.size.x; // Block
                }
            }
        }
        // Go Left
        if (p.pos.x < 0) {
            const prevZone = currentZoneRef.current - 1;
            if (prevZone >= 0) {
                loadZone(prevZone);
                p.pos.x = WORLD_WIDTH - 70; // Spawn right
                p.velocity.x = 0;
                p.pos.y = 350;
                p.velocity.y = 0;
            }
            else {
                p.pos.x = 0; // Block
            }
        }
        // --- HAZARDS ---
        for (const h of hazardsRef.current) {
            if (checkCollision(p, h)) {
                if (h.id === 'floor_spikes') {
                    p.invincibleTimer = 0;
                    takeDamage(100, 0);
                }
                else {
                    takeDamage(1, p.pos.x < h.pos.x ? -1 : 1);
                }
            }
        }
        // Kill floor (fall out of world)
        if (p.pos.y > WORLD_HEIGHT + 100) {
            p.invincibleTimer = 0;
            takeDamage(999, 0);
        }
        // --- ENEMIES ---
        enemiesRef.current.forEach((e, index) => {
            // Movement Logic
            if (e.type === 'crawler') {
                e.pos.x += e.velocity.x;
                if (e.pos.x > e.patrolEnd || e.pos.x < e.patrolStart) {
                    e.velocity.x *= -1;
                }
            }
            else if (e.type === 'flyer') {
                e.pos.x += e.velocity.x;
                if (e.pos.x > e.patrolEnd || e.pos.x < e.patrolStart) {
                    e.velocity.x *= -1;
                }
                // Bobbing motion
                e.pos.y += Math.sin(globalTimeRef.current * 5 + index) * 0.5;
            }
            else if (e.type === 'boss') {
                // --- BOSS AI STATE MACHINE ---
                // Defaults
                if (!e.aiState)
                    e.aiState = 'idle';
                if (!e.aiTimer)
                    e.aiTimer = 0;
                const dx = p.pos.x - e.pos.x;
                // Apply Gravity
                e.velocity.y += GRAVITY;
                e.pos.y += e.velocity.y;
                // Floor Collision
                let onGround = false;
                for (const plat of platformsRef.current) {
                    if (checkCollision(e, plat)) {
                        if (e.velocity.y > 0) {
                            e.pos.y = plat.pos.y - e.size.y;
                            e.velocity.y = 0;
                            onGround = true;
                        }
                        else if (e.velocity.y < 0) {
                            e.pos.y = plat.pos.y + plat.size.y;
                            e.velocity.y = 0;
                        }
                    }
                }
                // -- STATE LOGIC --
                if (e.aiState === 'idle') {
                    // Friction (Slow down)
                    e.velocity.x *= 0.8;
                    e.aiTimer--;
                    // Transition: After timer, decide next move
                    if (e.aiTimer <= 0) {
                        // Ready to attack
                        e.aiState = 'charge';
                        e.aiTimer = 180; // Charge for ~3 seconds max
                        // Small hop to start charge
                        e.velocity.y = -5;
                    }
                }
                else if (e.aiState === 'charge') {
                    // Aggressive Movement
                    const speed = 6;
                    // Accelerate towards player
                    e.velocity.x += dx > 0 ? 0.5 : -0.5;
                    e.velocity.x = Math.max(Math.min(e.velocity.x, speed), -speed);
                    // Jump if player is high up or random variance
                    if (onGround && (p.pos.y < e.pos.y - 80 || Math.random() < 0.02)) {
                        e.velocity.y = -13;
                    }
                    e.aiTimer--;
                    // Transition: If timer ends -> Retreat
                    if (e.aiTimer <= 0) {
                        e.aiState = 'retreat';
                        e.aiTimer = 90; // Retreat/Cooldown for 1.5s
                        // BIG jump away from player
                        e.velocity.y = -15;
                        e.velocity.x = dx > 0 ? -9 : 9; // Jump away
                        createParticles(e.pos.x + e.size.x / 2, e.pos.y + e.size.y, 10, '#fff'); // Dust
                    }
                }
                else if (e.aiState === 'retreat') {
                    // Air control dampening (keep momentum from the big jump)
                    e.velocity.x *= 0.98;
                    // If we landed and stopped moving fast, we are safe
                    if (onGround) {
                        e.velocity.x *= 0.8; // Rapidly stop sliding
                        e.aiTimer--;
                    }
                    if (e.aiTimer <= 0) {
                        e.aiState = 'idle';
                        e.aiTimer = 80; // Wait 1.3s before attacking again
                    }
                }
                // Apply Movement
                e.pos.x += e.velocity.x;
                // Boss Boundary (Clamp X)
                if (e.pos.x < e.patrolStart) {
                    e.pos.x = e.patrolStart;
                    e.velocity.x = 0;
                }
                if (e.pos.x > e.patrolEnd) {
                    e.pos.x = e.patrolEnd;
                    e.velocity.x = 0;
                }
                // Clamp Y (Absolute Safety vs Ceiling)
                if (e.pos.y < 50) {
                    e.pos.y = 50;
                    e.velocity.y = 0;
                }
                // Safety: Reset if fell out bottom
                if (e.pos.y > WORLD_HEIGHT) {
                    e.pos.x = 1200;
                    e.pos.y = 700;
                    e.velocity = { x: 0, y: 0 };
                }
            }
            // Player Collision
            if (!p.isDashing && checkCollision(p, e)) {
                let canDamage = true;
                if (e.type === 'boss' && e.aiState !== 'charge') {
                    canDamage = false;
                }
                if (canDamage) {
                    takeDamage(1, p.pos.x < e.pos.x ? -1 : 1);
                    if (e.type === 'boss') {
                        e.aiState = 'retreat';
                        e.aiTimer = 60;
                        e.velocity.y = -15;
                        e.velocity.x = (p.pos.x - e.pos.x) > 0 ? -8 : 8;
                    }
                }
            }
            // Hit by player attack
            if (attackHitboxRef.current && checkCollision(attackHitboxRef.current, e)) {
                e.health -= attackHitboxRef.current.damage;
                createParticles(e.pos.x + e.size.x / 2, e.pos.y + e.size.y / 2, 5, e.color);
                // Boss takes less knockback
                const knockbackMult = e.type === 'boss' ? 2 : 15;
                e.pos.x += p.facingRight ? knockbackMult : -knockbackMult;
                if (e.health <= 0) {
                    enemiesRef.current.splice(index, 1);
                    // Visual explosion
                    createParticles(e.pos.x, e.pos.y, 50, e.color);
                    // Win Condition Logic: Spawn Chest
                    if (e.type === 'boss') {
                        interactablesRef.current.push({
                            id: 'boss_chest',
                            pos: { x: e.pos.x, y: e.pos.y + e.size.y - 40 },
                            size: { x: 60, y: 40 },
                            color: '#fbbf24',
                            type: 'chest',
                            triggered: false
                        });
                        gateMessageRef.current = "The Silence Breaker falls...";
                        gateMessageTimerRef.current = 150;
                    }
                    // HEAL LOGIC
                    if (p.health < p.maxHealth) {
                        p.health = Math.min(p.health + 0.5, p.maxHealth);
                        onUpdateHealth(p.health);
                        createParticles(p.pos.x + p.size.x / 2, p.pos.y, 10, '#4ade80'); // Green heal particles
                    }
                }
            }
        });
        // --- ATTACK HITBOX ---
        if (attackHitboxRef.current) {
            attackHitboxRef.current.duration--;
            if (attackHitboxRef.current.duration <= 0) {
                attackHitboxRef.current = null;
            }
        }
        // --- PARTICLES ---
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const part = particlesRef.current[i];
            part.pos.x += part.velocity.x;
            part.pos.y += part.velocity.y;
            part.life--;
            part.velocity.x *= 0.95;
            part.velocity.y += 0.1;
            if (part.life <= 0) {
                particlesRef.current.splice(i, 1);
            }
        }
        // --- UI MESSAGES ---
        if (gateMessageTimerRef.current > 0) {
            gateMessageTimerRef.current--;
            if (gateMessageTimerRef.current <= 0)
                gateMessageRef.current = "";
        }
        // --- CAMERA ---
        const targetCamX = p.pos.x - window.innerWidth / 2 + p.size.x / 2;
        const targetCamY = p.pos.y - window.innerHeight / 2;
        cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.1;
        cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.1;
        cameraRef.current.x = Math.max(0, Math.min(cameraRef.current.x, WORLD_WIDTH - window.innerWidth));
        cameraRef.current.y = Math.max(0, Math.min(cameraRef.current.y, WORLD_HEIGHT - window.innerHeight));
    }, [gameState, setGameState, onUpdateHealth, loadZone, onUpdateRunes]);
    // Render Loop
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.fillStyle = COLORS.BACKGROUND;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(-cameraRef.current.x, -cameraRef.current.y);
        // Background Parallax
        ctx.fillStyle = '#1e293b';
        for (let i = 0; i < 100; i++) {
            if (currentZoneRef.current === 0) {
                ctx.fillRect((i * 150) % WORLD_WIDTH, (i * 90) % WORLD_HEIGHT, 2, 2);
            }
            else if (currentZoneRef.current === 1) {
                ctx.fillRect((i * 100) % WORLD_WIDTH, (i * 60) % WORLD_HEIGHT, 3, 3);
            }
            else {
                ctx.fillStyle = (i % 2 === 0) ? '#4c1d95' : '#581c87';
                ctx.fillRect((i * 80) % WORLD_WIDTH, (i * 120) % WORLD_HEIGHT, 4, 4);
                ctx.fillStyle = '#1e293b'; // Reset
            }
        }
        // Draw Locked Gate at the End of Level (if applicable)
        // Only draw for Zone 0 and 1
        if (currentZoneRef.current <= 1) {
            const totalRunes = interactablesRef.current.filter(i => i.type === 'lore_tablet').length;
            const collectedRunes = interactablesRef.current.filter(i => i.type === 'lore_tablet' && i.triggered).length;
            const isLocked = totalRunes > 0 && collectedRunes < totalRunes;
            if (isLocked) {
                const gateX = WORLD_WIDTH - 20;
                ctx.fillStyle = 'rgba(34, 211, 238, 0.2)'; // Cyan transparent
                ctx.fillRect(gateX, 0, 20, WORLD_HEIGHT);
                // Runes on gate
                ctx.fillStyle = 'rgba(34, 211, 238, 0.8)';
                for (let i = 0; i < 10; i++) {
                    ctx.fillRect(gateX + 5, (globalTimeRef.current * 50 + i * 100) % WORLD_HEIGHT, 10, 30);
                }
            }
        }
        // Platforms
        ctx.fillStyle = COLORS.PLATFORM;
        for (const plat of platformsRef.current) {
            ctx.fillRect(plat.pos.x, plat.pos.y, plat.size.x, plat.size.y);
            ctx.fillStyle = '#334155';
            ctx.fillRect(plat.pos.x + 2, plat.pos.y + 2, plat.size.x - 4, 5);
            ctx.fillStyle = COLORS.PLATFORM;
        }
        // Hazards (Spikes)
        ctx.fillStyle = COLORS.HAZARD;
        for (const h of hazardsRef.current) {
            if (h.type === 'spikes') {
                const spikeCount = Math.floor(h.size.x / 10);
                ctx.beginPath();
                for (let i = 0; i < spikeCount; i++) {
                    const x = h.pos.x + i * 10;
                    ctx.moveTo(x, h.pos.y + h.size.y);
                    ctx.lineTo(x + 5, h.pos.y);
                    ctx.lineTo(x + 10, h.pos.y + h.size.y);
                }
                ctx.fill();
            }
        }
        // Interactables
        for (const item of interactablesRef.current) {
            if (item.type === 'lore_tablet') {
                // Color change if triggered
                ctx.fillStyle = item.triggered ? '#94a3b8' : item.color;
                ctx.beginPath();
                ctx.moveTo(item.pos.x + item.size.x / 2, item.pos.y);
                ctx.lineTo(item.pos.x + item.size.x, item.pos.y + item.size.y / 2);
                ctx.lineTo(item.pos.x + item.size.x / 2, item.pos.y + item.size.y);
                ctx.lineTo(item.pos.x, item.pos.y + item.size.y / 2);
                ctx.fill();
                const dist = Math.abs(playerRef.current.pos.x - item.pos.x);
                if (dist < 100) {
                    ctx.fillStyle = '#fff';
                    ctx.font = '16px Arial';
                    const label = item.triggered ? '✓' : '!';
                    ctx.fillText(label, item.pos.x + 10, item.pos.y - 10);
                }
            }
            else if (item.type === 'chest') {
                ctx.fillStyle = item.color;
                // Chest Box
                ctx.fillRect(item.pos.x, item.pos.y, item.size.x, item.size.y);
                // Lid Detail
                ctx.fillStyle = '#fcd34d'; // Lighter Gold
                if (item.triggered) {
                    // Open lid
                    ctx.beginPath();
                    ctx.moveTo(item.pos.x, item.pos.y);
                    ctx.lineTo(item.pos.x + item.size.x, item.pos.y);
                    ctx.lineTo(item.pos.x + item.size.x - 5, item.pos.y - 15);
                    ctx.lineTo(item.pos.x + 5, item.pos.y - 15);
                    ctx.fill();
                }
                else {
                    // Closed lid line
                    ctx.fillRect(item.pos.x - 2, item.pos.y + 10, item.size.x + 4, 4);
                    // Lock
                    ctx.fillStyle = '#000';
                    ctx.fillRect(item.pos.x + item.size.x / 2 - 3, item.pos.y + 15, 6, 8);
                }
                const dist = Math.abs(playerRef.current.pos.x - item.pos.x);
                if (dist < 100 && !item.triggered) {
                    ctx.fillStyle = '#fff';
                    ctx.font = '16px Arial';
                    ctx.fillText("!", item.pos.x + 25, item.pos.y - 10);
                }
            }
            else if (item.type === 'boss_key' && !item.triggered) {
                // Floating Key
                const floatY = Math.sin(globalTimeRef.current * 4) * 5;
                ctx.fillStyle = item.color;
                ctx.beginPath();
                ctx.moveTo(item.pos.x + item.size.x / 2, item.pos.y + floatY);
                ctx.lineTo(item.pos.x + item.size.x, item.pos.y + item.size.y / 2 + floatY);
                ctx.lineTo(item.pos.x + item.size.x / 2, item.pos.y + item.size.y + floatY);
                ctx.lineTo(item.pos.x, item.pos.y + item.size.y / 2 + floatY);
                ctx.fill();
                // Inner shine
                ctx.fillStyle = '#fff';
                ctx.fillRect(item.pos.x + item.size.x / 2 - 2, item.pos.y + item.size.y / 2 + floatY - 2, 4, 4);
                const dist = Math.abs(playerRef.current.pos.x - item.pos.x);
                if (dist < 100) {
                    ctx.fillStyle = '#fff';
                    ctx.font = '16px Arial';
                    ctx.fillText("Take", item.pos.x + 5, item.pos.y - 10 + floatY);
                }
            }
            else if (item.type === 'final_gate') {
                // Big Door
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(item.pos.x, item.pos.y, item.size.x, item.size.y);
                // Border
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 4;
                ctx.strokeRect(item.pos.x, item.pos.y, item.size.x, item.size.y);
                // Lock Symbol
                ctx.fillStyle = hasBossKeyRef.current ? '#22d3ee' : '#ef4444';
                ctx.beginPath();
                ctx.arc(item.pos.x + item.size.x / 2, item.pos.y + item.size.y / 2, 10, 0, Math.PI * 2);
                ctx.fill();
                // Message
                const dist = Math.abs(playerRef.current.pos.x - item.pos.x);
                if (dist < 150) {
                    ctx.fillStyle = '#fff';
                    ctx.font = '16px Arial';
                    ctx.fillText(hasBossKeyRef.current ? "Open" : "Locked", item.pos.x + 10, item.pos.y - 20);
                }
            }
        }
        // Enemies
        for (const e of enemiesRef.current) {
            ctx.fillStyle = e.color;
            if (e.type === 'flyer') {
                ctx.beginPath();
                ctx.moveTo(e.pos.x + e.size.x / 2, e.pos.y);
                ctx.lineTo(e.pos.x + e.size.x, e.pos.y + e.size.y / 2);
                ctx.lineTo(e.pos.x + e.size.x / 2, e.pos.y + e.size.y);
                ctx.lineTo(e.pos.x, e.pos.y + e.size.y / 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                const wingOffset = Math.sin(globalTimeRef.current * 15) * 10;
                ctx.fillRect(e.pos.x - 10, e.pos.y + 10 - wingOffset, 10, 5);
                ctx.fillRect(e.pos.x + e.size.x, e.pos.y + 10 - wingOffset, 10, 5);
            }
            else if (e.type === 'boss') {
                let eyeColor = '#fde047';
                if (e.aiState === 'charge')
                    eyeColor = '#ef4444';
                if (e.aiState === 'retreat')
                    eyeColor = '#94a3b8';
                ctx.fillRect(e.pos.x, e.pos.y, e.size.x, e.size.y);
                ctx.beginPath();
                ctx.moveTo(e.pos.x, e.pos.y);
                ctx.lineTo(e.pos.x - 10, e.pos.y - 30);
                ctx.lineTo(e.pos.x + 20, e.pos.y);
                ctx.lineTo(e.pos.x + e.size.x / 2, e.pos.y - 50);
                ctx.lineTo(e.pos.x + e.size.x - 20, e.pos.y);
                ctx.lineTo(e.pos.x + e.size.x + 10, e.pos.y - 30);
                ctx.lineTo(e.pos.x + e.size.x, e.pos.y);
                ctx.fill();
                ctx.fillStyle = eyeColor;
                ctx.beginPath();
                ctx.arc(e.pos.x + 20, e.pos.y + 40, 8, 0, Math.PI * 2);
                ctx.arc(e.pos.x + e.size.x - 20, e.pos.y + 40, 8, 0, Math.PI * 2);
                ctx.fill();
                const hpPercent = e.health / 40;
                ctx.fillStyle = '#000';
                ctx.fillRect(e.pos.x, e.pos.y - 60, e.size.x, 10);
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(e.pos.x, e.pos.y - 60, e.size.x * hpPercent, 10);
            }
            else {
                ctx.fillRect(e.pos.x, e.pos.y, e.size.x, e.size.y);
            }
            if (e.type !== 'boss') {
                ctx.fillStyle = '#000';
                ctx.fillRect(e.pos.x + 5, e.pos.y + 10, 5, 5);
                ctx.fillRect(e.pos.x + e.size.x - 10, e.pos.y + 10, 5, 5);
            }
        }
        // Player
        const p = playerRef.current;
        if (p.invincibleTimer % 8 < 4) {
            ctx.save();
            // Squash and Stretch
            let scaleX = 1;
            let scaleY = 1;
            // Only stretch if airborne
            if (!p.isGrounded) {
                // Stretch factor based on speed. Max speed is around 15 usually.
                // 1 + (10 * 0.03) = 1.3
                const stretch = Math.max(0.8, Math.min(1.3, 1 + Math.abs(p.velocity.y) * 0.03));
                scaleY = stretch;
                scaleX = 1 / stretch; // Conservation of area
            }
            // Pivot at bottom center
            const cx = p.pos.x + p.size.x / 2;
            const cy = p.pos.y + p.size.y;
            ctx.translate(cx, cy);
            ctx.scale(scaleX, scaleY);
            // Draw relative to (0, 0) at bottom center
            ctx.fillStyle = p.isDashing ? '#a5b4fc' : p.color;
            // Body: -15 to 15 width, -35 to 0 height (relative)
            ctx.fillRect(-p.size.x / 2, -35, p.size.x, 35);
            // Head: Center at (0, -35), Radius 15
            ctx.beginPath();
            ctx.arc(0, -35, 15, 0, Math.PI * 2);
            ctx.fill();
            // Eyes: Center at (0, -38)
            ctx.fillStyle = '#000';
            const eyeOffset = p.facingRight ? 4 : -4;
            ctx.beginPath();
            ctx.ellipse(eyeOffset + 5, -38, 3, 8, 0, 0, Math.PI * 2);
            ctx.ellipse(eyeOffset - 5, -38, 3, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            // Dash Ghost
            if (p.isDashing) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(p.pos.x - (p.facingRight ? 20 : -20), p.pos.y, p.size.x, p.size.y);
            }
        }
        // Attack Visual (Dynamic Slash)
        if (attackHitboxRef.current) {
            const hb = attackHitboxRef.current;
            const progress = 1 - (hb.duration / ATTACK_DURATION);
            const p = playerRef.current;
            ctx.save();
            // Determine center of hitbox
            const cx = hb.pos.x + hb.size.x / 2;
            const cy = hb.pos.y + hb.size.y / 2;
            // Determine direction based on position relative to player center
            // If hitbox center is to the right of player center, it's a right slash
            const isRight = cx > (p.pos.x + p.size.x / 2);
            ctx.translate(cx, cy);
            ctx.scale(isRight ? 1 : -1, 1); // Face direction
            // Animation: Slight expansion and fade out
            const scale = 1 + progress * 0.3;
            ctx.scale(scale, scale);
            ctx.globalAlpha = Math.max(0, 1 - progress * 1.2); // Fade out slightly faster than duration
            ctx.fillStyle = '#f1f5f9'; // slate-100
            ctx.shadowColor = '#cbd5e1';
            ctx.shadowBlur = 10;
            // Draw Slash (Crescent shape)
            ctx.beginPath();
            // Start top-inner
            ctx.moveTo(-10, -35);
            // Curve to bottom-inner (outer edge of slash)
            ctx.bezierCurveTo(60, -10, 60, 10, -10, 35);
            // Curve back to top-inner (inner edge of slash - creates the taper)
            ctx.bezierCurveTo(40, 10, 40, -10, -10, -35);
            ctx.fill();
            // Add an "impact" line if it's the first few frames
            if (progress < 0.3) {
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(255,255,255,0.8)';
                ctx.lineWidth = 2;
                ctx.moveTo(0, 0);
                ctx.lineTo(50, 0);
                ctx.stroke();
            }
            ctx.restore();
        }
        // Particles
        for (const part of particlesRef.current) {
            ctx.globalAlpha = part.life / part.maxLife;
            ctx.fillStyle = part.color;
            ctx.fillRect(part.pos.x, part.pos.y, part.size, part.size);
            ctx.globalAlpha = 1.0;
        }
        ctx.restore();
        // UI Floating Text (Gate Message)
        if (gateMessageRef.current) {
            ctx.save();
            ctx.fillStyle = '#fff';
            ctx.font = '24px serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 4;
            ctx.fillText(gateMessageRef.current, window.innerWidth / 2, 100);
            ctx.restore();
        }
    }, [gameState]);
    // Main Loop
    const loop = useCallback(() => {
        update();
        render();
        requestRef.current = requestAnimationFrame(loop);
    }, [update, render]);
    useEffect(() => {
        requestRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(requestRef.current);
    }, [loop]);
    return _jsx("canvas", { ref: canvasRef, className: "block w-full h-full" });
};
export default GameCanvas;
