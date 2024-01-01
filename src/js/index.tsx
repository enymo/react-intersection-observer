import { createContext } from "@enymo/react-better-context";
import { isNotNull } from "@enymo/ts-nullsafe";
import React, { useCallback, useEffect, useMemo, useRef } from "react";

type Listener = (entry: IntersectionObserverEntry) => void;
type Observe = (target: Element, callback: Listener) => void;
type Unobserve = (target: Element) => void;

const [IntersectionObserverContextProvider, useIntersectionObserver] = createContext<{
    observe: Observe,
    unobserve: Unobserve
} | null>(null);

export function ObserverProvider({options, children}: {
    options?: IntersectionObserverInit,
    children: React.ReactNode
}) {
    const targets = useRef(new Map<Element, Listener>());

    const intersectionObserver = useMemo(() => new IntersectionObserver(entries => {
        for (const entry of entries) {
            targets.current.get(entry.target)?.(entry);
        }
    }, options), [options, targets]);

    const observe = useCallback<Observe>((target, callback) => {
        if (!targets.current.has(target)) {
            intersectionObserver.observe(target);
        }
        targets.current.set(target, callback);
    }, [intersectionObserver, targets]);

    const unobserve = useCallback<Unobserve>(target => {
        if (targets.current.has(target)) {
            targets.current.delete(target);
            intersectionObserver.unobserve(target);
        }
    }, [targets, intersectionObserver]);

    return (
        <IntersectionObserverContextProvider value={{observe, unobserve}}>
            {children}
        </IntersectionObserverContextProvider>
    )
}

export function useObserved(callback: Listener, dependencies: React.DependencyList = []) {
    const context = useIntersectionObserver();
    const ref = useRef<Element>(null);
    
    useEffect(() => {
        const target = ref.current;
        if (isNotNull(target)) {
            context?.observe(target, callback);
            return () => context?.unobserve(target);
        }
    }, [ref, context, ...dependencies]);

    return ref;
}