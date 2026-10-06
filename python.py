"""
Foret Magique 3D - Jeu Python pour calculatrice NumWorks
Projet prêt pour dépôt GitHub.
"""

import time
from ion import *
from kandinsky import *
from random import randint

# Dimensions de l'écran NumWorks
LARGEUR = 320
HAUTEUR = 240

# Palette de couleurs enrichie pour l'effet 3D
NOIR = color(0, 0, 0)
BLANC = color(255, 255, 255)
ROUGE = color(220, 40, 40)
ROUGE_FONCE = color(120, 20, 20)
VERT_HERBE = color(34, 139, 34)
VERT_HERBE_CLAIR = color(50, 165, 50)
VERT_FONCE = color(0, 80, 0)
MARRON = color(101, 67, 33)
MARRON_FONCE = color(60, 40, 20)
BLEU = color(50, 150, 255)
BLEU_FONCE = color(20, 80, 180)
JAUNE = color(255, 220, 0)
ORANGE = color(255, 140, 0)
CYAN = color(0, 255, 255)
GRIS = color(120, 120, 120)
GRIS_FONCE = color(60, 60, 60)
VERT_GOBELIN = color(50, 205, 50)
VIOLET = color(148, 0, 211)
VIOLET_FONCE = color(75, 0, 130)
OMBRE = color(20, 70, 20)

class JeuForetMagique:
    def __init__(self):
        self.px = 150
        self.py = 110
        self.pv_max = 100
        self.pv = self.pv_max
        self.vitesse = 3
        self.mul_degats = 1.0
        self.portee_bonus = 0
        self.or_joueur = 20
        self.nb_tirs = 1

        self.sk1_debloque = False
        self.sk2_debloque = False
        self.sk3_debloque = False
        self.ulti_debloque = False

        self.boost_vitesse_timer = 0
        self.boost_degats_timer = 0
        self.gel_monstres_timer = 0

        self.cd1 = 0
        self.cd2 = 0
        self.cd3 = 0
        self.cd_dash = 0

        self.vague = 1
        self.arme = "Epee"
        self.arbres = [(30, 40), (100, 140), (220, 50), (260, 150)]
        self.monstres = []
        self.blocs_bonus = []
        self.projectiles = []
        self.proj_ennemis = []
        self.popups = []
        self.dir_x = 1
        self.dir_y = 0

    def dessiner_arbre_3d(self, ax, ay):
        # Ombre au sol
        fill_rect(ax - 2, ay + 26, 28, 8, OMBRE)
        # Tronc avec reflet
        fill_rect(ax + 8, ay + 12, 8, 18, MARRON)
        fill_rect(ax + 8, ay + 12, 2, 18, MARRON_FONCE)
        # Feillage multi-couches (effet 3D)
        fill_rect(ax, ay + 6, 24, 12, VERT_FONCE)
        fill_rect(ax + 2, ay, 20, 12, VERT_HERBE_CLAIR)

    def effacer_zone(self, x, y, w, h):
        fill_rect(x, y, w, h, VERT_HERBE)

    def dessiner_decor_3d(self):
        # Sol en perspective avec lignes de relief
        fill_rect(0, 20, LARGEUR, HAUTEUR - 40, VERT_HERBE)
        for y in range(20, HAUTEUR - 20, 20):
            coul_ligne = VERT_HERBE_CLAIR if (y // 20) % 2 == 0 else VERT_HERBE
            fill_rect(0, y, LARGEUR, 2, coul_ligne)
        
        for ax, ay in self.arbres:
            self.dessiner_arbre_3d(ax, ay)

    def dessiner_stickman_3d(self, x, y, couleur):
        # Ombre portée
        fill_rect(x, y + 15, 10, 4, OMBRE)
        # Corps 3D
        fill_rect(x + 3, y, 4, 4, couleur)
        fill_rect(x + 4, y + 4, 2, 8, BLEU_FONCE)
        fill_rect(x + 2, y + 12, 2, 4, BLEU_FONCE)
        fill_rect(x + 6, y + 12, 2, 4, BLEU_FONCE)

    def dessiner_monstre_3d(self, m):
        mx, my, t = m[0], m[1], m[3]
        taille = 24 if t == "BOSS" else 12
        # Ombre portée
        fill_rect(mx, my + taille - 2, taille, 4, OMBRE)

        if t == "Gobelin":
            fill_rect(mx + 2, my + 4, 8, 8, VERT_GOBELIN)
            fill_rect(mx, my + 4, 2, 2, VERT_FONCE)
        elif t == "Orc":
            fill_rect(mx, my, 12, 12, ROUGE)
            fill_rect(mx, my, 3, 12, ROUGE_FONCE)
        elif t == "Sorcier":
            fill_rect(mx + 3, my, 6, 4, VIOLET)
            fill_rect(mx + 1, my + 4, 10, 8, VIOLET_FONCE)
        elif t == "BOSS":
            # Boss relief 3D (Bordures + Cœur lumineux)
            fill_rect(mx, my, 24, 24, VIOLET_FONCE)
            fill_rect(mx + 2, my + 2, 20, 20, VIOLET)
            fill_rect(mx + 6, my + 6, 12, 12, NOIR)
            fill_rect(mx + 9, my + 9, 6, 6, JAUNE)

    def menu(self):
        fill_rect(0, 0, LARGEUR, HAUTEUR, NOIR)
        draw_string("=== FORET MAGIQUE 3D ===", 40, 20, BLANC, NOIR)
        draw_string("1. Epee (Tranchant)", 30, 70, BLEU, NOIR)
        draw_string("2. Arc (Fleches)", 30, 100, VERT_GOBELIN, NOIR)
        draw_string("3. Baton (Mage / Trou Noir)", 30, 130, JAUNE, NOIR)
        draw_string("Appuie sur 1, 2 ou 3...", 40, 180, GRIS, NOIR)
        while True:
            if keydown(KEY_ONE): return "Epee"
            elif keydown(KEY_TWO): return "Arc"
            elif keydown(KEY_THREE): return "Baton"
            time.sleep(0.05)

    def boutique(self):
        page = 1
        max_cd1, max_cd2, max_cd3 = 15, 30 if self.arme != "Baton" else 45, 50
        while True:
            fill_rect(0, 0, LARGEUR, HAUTEUR, NOIR)
            draw_string("=== BOUTIQUE (Or: " + str(self.or_joueur) + "g) ===", 10, 5, JAUNE, NOIR)

            if page == 1:
                draw_string("--- STATS & TIR (1/2) ---", 10, 25, GRIS, NOIR)
                draw_string("1. Soin +25 PV (20g)", 10, 45, VERT_GOBELIN, NOIR)
                draw_string("2. Soin Max (35g)", 10, 65, VERT_GOBELIN, NOIR)
                draw_string("3. +20 PV Max (30g)", 10, 85, BLEU, NOIR)
                draw_string("4. +20% Degats (40g)", 10, 105, ROUGE, NOIR)
                
                prix_tir = str(self.nb_tirs * 100) + "g" if self.nb_tirs < 4 else "MAX"
                draw_string("5. +1 Dir. Tir (" + prix_tir + ")", 10, 125, CYAN, NOIR)
                draw_string("6. +Portee (30g)", 10, 145, ORANGE, NOIR)
                draw_string("OK: Page 2 | BACKSPACE: Fermer", 10, 210, GRIS, NOIR)
            else:
                draw_string("--- SORTS & ULTIME (2/2) ---", 10, 25, GRIS, NOIR)
                str_sk1 = "ACQUIS" if self.sk1_debloque else "30g"
                str_sk2 = "ACQUIS" if self.sk2_debloque else "50g"
                str_sk3 = "ACQUIS" if self.sk3_debloque else "80g"
                str_ult = "ACQUIS" if self.ulti_debloque else "1000g"
                draw_string("1. Sort 1 (" + str_sk1 + ")", 10, 50, BLEU, NOIR)
                draw_string("2. Sort 2 (" + str_sk2 + ")", 10, 75, VERT_GOBELIN, NOIR)
                draw_string("3. Sort 3 (" + str_sk3 + ")", 10, 100, ORANGE, NOIR)
                draw_string("4. ULTIME SHIFT (" + str_ult + ")", 10, 130, VIOLET, NOIR)
                draw_string("OK: Page 1 | BACKSPACE: Fermer", 10, 210, GRIS, NOIR)

            time.sleep(0.15)
            
            attente = True
            while attente:
                if page == 1:
                    if keydown(KEY_ONE) and self.or_joueur >= 20 and self.pv < self.pv_max:
                        self.or_joueur -= 20
                        self.pv = min(self.pv_max, self.pv + 25)
                        attente = False
                    elif keydown(KEY_TWO) and self.or_joueur >= 35 and self.pv < self.pv_max:
                        self.or_joueur -= 35
                        self.pv = self.pv_max
                        attente = False
                    elif keydown(KEY_THREE) and self.or_joueur >= 30:
                        self.or_joueur -= 30
                        self.pv_max += 20
                        self.pv += 20
                        attente = False
                    elif keydown(KEY_FOUR) and self.or_joueur >= 40:
                        self.or_joueur -= 40
                        self.mul_degats += 0.2
                        attente = False
                    elif keydown(KEY_FIVE) and self.nb_tirs < 4 and self.or_joueur >= (self.nb_tirs * 100):
                        self.or_joueur -= (self.nb_tirs * 100)
                        self.nb_tirs += 1
                        attente = False
                    elif keydown(KEY_SIX) and self.or_joueur >= 30:
                        self.or_joueur -= 30
                        self.portee_bonus += 5
                        attente = False
                else:
                    if keydown(KEY_ONE) and self.or_joueur >= 30 and not self.sk1_debloque:
                        self.or_joueur -= 30
                        self.sk1_debloque = True
                        attente = False
                    elif keydown(KEY_TWO) and self.or_joueur >= 50 and not self.sk2_debloque:
                        self.or_joueur -= 50
                        self.sk2_debloque = True
                        attente = False
                    elif keydown(KEY_THREE) and self.or_joueur >= 80 and not self.sk3_debloque:
                        self.or_joueur -= 80
                        self.sk3_debloque = True
                        attente = False
                    elif keydown(KEY_FOUR) and self.or_joueur >= 1000 and not self.ulti_debloque:
                        self.or_joueur -= 1000
                        self.ulti_debloque = True
                        attente = False

                if keydown(KEY_OK):
                    page = 2 if page == 1 else 1
                    attente = False
                elif keydown(KEY_BACKSPACE):
                    time.sleep(0.2)
                    return

                time.sleep(0.05)

    def afficher_interface(self, boss=None):
        fill_rect(0, 0, LARGEUR, 20, NOIR)
        draw_string("PV:" + str(self.pv) + "/" + str(self.pv_max), 5, 2, ROUGE, NOIR)
        draw_string("Vague:" + str(self.vague), 130, 2, BLANC, NOIR)
        draw_string("Or:" + str(self.or_joueur) + "g", 240, 2, JAUNE, NOIR)

        if boss is not None:
            pv_boss, pv_boss_max = boss[2], boss[5]
            ratio = max(0, pv_boss / pv_boss_max)
            fill_rect(80, 22, 160, 6, GRIS_FONCE)
            fill_rect(80, 22, int(160 * ratio), 6, ROUGE)

        fill_rect(0, HAUTEUR - 20, LARGEUR, 20, NOIR)
        draw_string("Dash:0", 5, 222, GRIS, NOIR)
        
        def dessiner_jauge(x, cd, max_cd, nom, coul, debloque):
            fill_rect(x, 224, 30, 10, GRIS_FONCE)
            if not debloque:
                draw_string("X", x + 10, 222, ROUGE, GRIS_FONCE)
            else:
                if max_cd > 0:
                    ratio = max(0, (max_cd - cd) / max_cd)
                    fill_rect(x, 224, int(30 * ratio), 10, coul)
                draw_string(nom, x + 8, 222, NOIR, coul if cd == 0 else GRIS)

        max_cd1, max_cd2, max_cd3 = 15, 30 if self.arme != "Baton" else 45, 50
        dessiner_jauge(80, self.cd1, max_cd1, "1", BLEU, self.sk1_debloque)
        dessiner_jauge(140, self.cd2, max_cd2, "2", VERT_GOBELIN, self.sk2_debloque)
        dessiner_jauge(200, self.cd3, max_cd3, "3", ORANGE, self.sk3_debloque)

        coul_ult = VIOLET if self.ulti_debloque else GRIS_FONCE
        fill_rect(260, 224, 50, 10, coul_ult)
        draw_string("ULT", 270, 222, BLANC if self.ulti_debloque else GRIS, coul_ult)

    def generer_monstres(self, nb):
        m_list = []
        if self.vague % 5 == 0:
            pv_boss = 200 + self.vague * 50
            m_list.append([LARGEUR // 2 - 12, 40, pv_boss, "BOSS", 0, pv_boss])
            return m_list

        types = ["Gobelin"]
        if self.vague >= 2: types.append("Sorcier")
        if self.vague >= 3: types.append("Orc")

        for _ in range(nb):
            t = types[randint(0, len(types) - 1)]
            mx = randint(10, LARGEUR - 20)
            my = 30 if randint(0, 1) == 0 else HAUTEUR - 40
            pv = 12 if t == "Gobelin" else (30 if t == "Orc" else 18)
            m_list.append([mx, my, pv + self.vague * 4, t, 0, pv + self.vague * 4])
        return m_list

    def executer_ultime(self):
        for m in self.monstres:
            m[2] = 0
            gain = 100 if m[3] == "BOSS" else 15
            self.or_joueur += gain
            self.popups.append(["+" + str(gain) + "g", m[0], m[1], 8, JAUNE])
        
        # Animation Trou Noir 3D pour le Mage
        if self.arme == "Baton":
            cx, cy = self.px + 5, self.py + 8
            for r in range(5, 70, 5):
                fill_rect(cx - r, cy - r, r * 2, r * 2, VIOLET_FONCE)
                fill_rect(cx - (r // 2), cy - (r // 2), r, r, NOIR)
                time.sleep(0.02)
        elif self.arme == "Epee":
            fill_rect(0, 20, LARGEUR, HAUTEUR - 40, BLANC)
            time.sleep(0.04)
            fill_rect(0, 20, LARGEUR, HAUTEUR - 40, CYAN)
            time.sleep(0.04)
        elif self.arme == "Arc":
            for _ in range(25):
                rx, ry = randint(10, LARGEUR - 10), randint(30, HAUTEUR - 30)
                fill_rect(rx, ry, 2, 14, GRIS)

        self.dessiner_decor_3d()
        self.monstres = []

    def jouer(self):
        self.arme = self.menu()
        self.boutique()
        self.dessiner_decor_3d()
        self.monstres = self.generer_monstres(3)

        max_cd1, max_cd2, max_cd3 = 15, 30 if self.arme != "Baton" else 45, 50

        while self.pv > 0:
            self.effacer_zone(self.px, self.py, 10, 16)

            # Déplacement
            dx, dy = 0, 0
            v_actuelle = self.vitesse + (2 if self.boost_vitesse_timer > 0 else 0)
            if keydown(KEY_ZERO) and self.cd_dash <= 0:
                v_actuelle *= 2.5
                self.cd_dash = 20

            if keydown(KEY_LEFT) and self.px > 5: dx -= v_actuelle
            if keydown(KEY_RIGHT) and self.px < LARGEUR - 15: dx += v_actuelle
            if keydown(KEY_UP) and self.py > 25: dy -= v_actuelle
            if keydown(KEY_DOWN) and self.py < HAUTEUR - 38: dy += v_actuelle

            self.px += int(dx)
            self.py += int(dy)
            if dx != 0 or dy != 0:
                self.dir_x = 1 if dx > 0 else (-1 if dx < 0 else 0)
                self.dir_y = 1 if dy > 0 else (-1 if dy < 0 else 0)

            # Tir
            def tirer_base(dx, dy, degats, taille, couleur, duree, vit=6):
                mult = self.mul_degats * (2.0 if self.boost_degats_timer > 0 else 1.0)
                deg = int(degats * mult)
                self.projectiles.append([self.px + 4, self.py + 4, dx * vit, dy * vit, deg, taille, couleur, duree + self.portee_bonus])

            def lancer_attaque(degats, taille, couleur, duree, vit=6):
                tirer_base(self.dir_x, self.dir_y, degats, taille, couleur, duree, vit)
                if self.nb_tirs >= 2:
                    tirer_base(-self.dir_x if self.dir_x != 0 else 1, -self.dir_y if self.dir_y != 0 else 1, degats, taille, couleur, duree, vit)
                if self.nb_tirs >= 3:
                    tirer_base(0, -1, degats, taille, couleur, duree, vit)
                if self.nb_tirs >= 4:
                    tirer_base(0, 1, degats, taille, couleur, duree, vit)

            if keydown(KEY_OK) or keydown(KEY_EXE):
                if self.arme == "Epee": lancer_attaque(15, 6, CYAN, 3, 4)
                elif self.arme == "Arc": lancer_attaque(12, 3, GRIS, 12, 8)
                elif self.arme == "Baton": lancer_attaque(10, 5, ORANGE, 10, 5)

            if keydown(KEY_SHIFT) and self.ulti_debloque:
                self.executer_ultime()

            if keydown(KEY_ONE) and self.cd1 <= 0 and self.sk1_debloque:
                self.cd1 = max_cd1
                lancer_attaque(25, 8, BLEU, 4, 5)

            if keydown(KEY_TWO) and self.cd2 <= 0 and self.sk2_debloque:
                self.cd2 = max_cd2
                if self.arme == "Baton": self.pv = min(self.pv_max, self.pv + 30)
                else: lancer_attaque(50, 10, BLANC, 5, 7)

            if keydown(KEY_THREE) and self.cd3 <= 0 and self.sk3_debloque:
                self.cd3 = max_cd3
                for vx, vy in [(1,0), (-1,0), (0,1), (0,-1)]:
                    tirer_base(vx, vy, 60, 10, JAUNE, 6, 6)

            # Traitement Projectiles Joueur
            nouveaux_proj = []
            for p in self.projectiles:
                self.effacer_zone(int(p[0]), int(p[1]), p[5], p[5])
                p[0] += p[2]
                p[1] += p[3]
                p[7] -= 1

                toucher = False
                for m in self.monstres:
                    taille_m = 24 if m[3] == "BOSS" else 12
                    if abs(p[0] - m[0]) < taille_m and abs(p[1] - m[1]) < taille_m:
                        m[2] -= p[4]
                        toucher = True
                        self.popups.append([str(p[4]), int(m[0]), int(m[1]) - 5, 5, JAUNE])

                if not toucher and p[7] > 0 and 5 < p[0] < LARGEUR - 10 and 22 < p[1] < HAUTEUR - 25:
                    fill_rect(int(p[0]), int(p[1]), p[5], p[5], p[6])
                    nouveaux_proj.append(p)
            self.projectiles = nouveaux_proj

            # Traitement Monstres
            nouveaux_monstres = []
            for m in self.monstres:
                taille_m = 24 if m[3] == "BOSS" else 12
                self.effacer_zone(m[0], m[1], taille_m, taille_m)

                if m[2] <= 0:
                    gain = 100 if m[3] == "BOSS" else 15
                    self.or_joueur += gain
                    self.popups.append(["+" + str(gain) + "g", m[0], m[1], 8, JAUNE])
                    continue

                vit = 1 if m[3] == "BOSS" else 2
                if m[0] < self.px: m[0] += vit
                elif m[0] > self.px: m[0] -= vit
                if m[1] < self.py: m[1] += vit
                elif m[1] > self.py: m[1] -= vit

                self.dessiner_monstre_3d(m)
                nouveaux_monstres.append(m)

            self.monstres = nouveaux_monstres

            # Rendu du joueur et tri z (Y-Sorting)
            self.dessiner_stickman_3d(self.px, self.py, BLEU)

            if len(self.monstres) == 0:
                self.vague += 1
                self.boutique()
                self.dessiner_decor_3d()
                self.monstres = self.generer_monstres(2 + self.vague * 2)

            if self.cd1 > 0: self.cd1 -= 1
            if self.cd2 > 0: self.cd2 -= 1
            if self.cd3 > 0: self.cd3 -= 1
            if self.cd_dash > 0: self.cd_dash -= 1

            boss_actuel = self.monstres[0] if len(self.monstres) > 0 and self.monstres[0][3] == "BOSS" else None
            self.afficher_interface(boss_actuel)
            time.sleep(0.02)

        fill_rect(0, 0, LARGEUR, HAUTEUR, NOIR)
        draw_string("GAME OVER", 110, 90, ROUGE, NOIR)
        draw_string("Vagues survecues : " + str(self.vague - 1), 60, 120, BLANC, NOIR)

# Lancement du jeu
jeu = JeuForetMagique()
jeu.jouer()