'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { AnimatedBg } from '@/components/ui/animated-bg';
import { Sparkles, Mail } from 'lucide-react';

export function LegalPage({ heroIcon: HeroIcon, eyebrow, title, titleHighlight, description, updatedDate, sections, extraSections = [] }) {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="pt-28 pb-20 relative">
                <AnimatedBg variant="orbs" className="opacity-40" />

                <Section className="py-16">
                    <Container size="sm">
                        <div className="text-center">
                            <div className="inline-flex w-16 h-16 rounded-3xl bg-brand-500/10 items-center justify-center mb-6">
                                <HeroIcon className="w-8 h-8 text-brand-500" />
                            </div>
                            <Badge variant="glass" className="mb-4">
                                <Sparkles className="w-3 h-3 text-brand-500" />
                                {eyebrow}
                            </Badge>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tight mb-4 text-balance">
                                {title}{' '}
                                <span className="gradient-text">{titleHighlight}</span>
                            </h1>
                            <p className="text-base md:text-lg text-muted-foreground text-balance">
                                {description}
                            </p>
                            {updatedDate && (
                                <p className="text-xs text-muted-foreground mt-4">
                                    Terakhir diperbarui: {updatedDate}
                                </p>
                            )}
                        </div>
                    </Container>
                </Section>

                <Section className="py-8">
                    <Container size="sm">
                        <div className="space-y-6">
                            {sections.map((section, index) => (
                                <Card key={index} variant="default" padding="lg" className="overflow-hidden">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-11 h-11 rounded-2xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                                            <section.icon className="w-5 h-5 text-brand-500" />
                                        </div>
                                        <h2 className="text-xl md:text-2xl font-display font-bold">{section.title}</h2>
                                    </div>
                                    <ul className="space-y-3">
                                        {section.items.map((item, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0 mt-2.5" />
                                                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{item}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </Card>
                            ))}

                            {extraSections}

                            <Card variant="glass" padding="lg" className="text-center">
                                <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-500/10 flex items-center justify-center mb-4">
                                    <Mail className="w-6 h-6 text-brand-500" />
                                </div>
                                <h3 className="font-display font-bold text-lg mb-2">Punya Pertanyaan?</h3>
                                <p className="text-muted-foreground text-sm">
                                    Hubungi kami melalui Discord atau email{' '}
                                    <a href="mailto:support@kingblox.id" className="text-brand-500 font-semibold hover:underline">
                                        support@kingblox.id
                                    </a>
                                </p>
                            </Card>
                        </div>
                    </Container>
                </Section>
            </main>
            <Footer />
        </div>
    );
}
